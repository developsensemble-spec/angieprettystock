"use server";

import { prisma } from "../lib-prisma";
import { currentUser, createSession, destroySession, requireRoles } from "../lib-auth";
import { Role, Destination, OrderStatus, PaymentStatus, StockMovementType, ParcelStatus, FeedbackStatus, DispatchFeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=identifiants");
  }
  await createSession(user.id);
  redirect("/");
}
export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
export async function createUserAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER]);
  const data = z.object({
    name: z.string().min(2), email: z.string().email(),
    password: z.string().min(12), role: z.nativeEnum(Role)
  }).parse({
    name: formData.get("name"), email: String(formData.get("email") || "").toLowerCase(),
    password: formData.get("password"), role: formData.get("role")
  });
  const user = await prisma.user.create({ data: { name: data.name, email: data.email, passwordHash: await bcrypt.hash(data.password, 12), role: data.role } });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "CREATE_USER", entity: "User", entityId: user.id } });
  revalidatePath("/admin");
}
export async function createProductAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.WAREHOUSE]);
  const data = z.object({
    sku: z.string().min(2), name: z.string().min(2), category: z.string().min(2),
    variantSku: z.string().min(2), model: z.string().min(1), size: z.string().min(1),
    color: z.string().min(1), unitPrice: z.coerce.number().int().nonnegative(),
    stock: z.coerce.number().int().nonnegative(), alertAt: z.coerce.number().int().nonnegative()
  }).parse({
    sku: formData.get("sku"), name: formData.get("name"), category: formData.get("category"),
    variantSku: formData.get("variantSku"), model: formData.get("model"), size: formData.get("size"),
    color: formData.get("color"), unitPrice: formData.get("unitPrice"),
    stock: formData.get("stock"), alertAt: formData.get("alertAt")
  });
  await prisma.$transaction(async tx => {
    const product = await tx.product.create({ data: { sku: data.sku, name: data.name, category: data.category } });
    const variant = await tx.variant.create({ data: {
      sku: data.variantSku, productId: product.id, model: data.model, size: data.size, color: data.color,
      unitPrice: data.unitPrice, stockOnHand: data.stock, alertAt: data.alertAt
    }});
    if (data.stock > 0) await tx.stockMovement.create({ data: { variantId: variant.id, userId: actor.id, type: StockMovementType.RECEIPT, quantity: data.stock, reason: "Stock initial à la création" } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CREATE_PRODUCT", entity: "Product", entityId: product.id } });
  });
  revalidatePath("/products"); revalidatePath("/stock");
}

export async function createInitialInventoryAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.WAREHOUSE]);
  const sizes = String(formData.get("sizes") || "").split(",").map(x=>x.trim()).filter(Boolean);
  const colors = String(formData.get("colors") || "").split(",").map(x=>x.trim()).filter(Boolean);
  const data = z.object({
    sku:z.string().min(2), name:z.string().min(2), category:z.string().min(2), model:z.string().min(1),
    unitPrice:z.coerce.number().int().nonnegative(), purchasePrice:z.coerce.number().int().nonnegative(), alertAt:z.coerce.number().int().nonnegative()
  }).parse({sku:formData.get("sku"),name:formData.get("name"),category:formData.get("category"),model:formData.get("model"),unitPrice:formData.get("unitPrice"),purchasePrice:formData.get("purchasePrice"),alertAt:formData.get("alertAt")});
  if (!sizes.length || !colors.length) throw new Error("Sélectionnez au moins une taille et une couleur.");
  if (sizes.length*colors.length > 250) throw new Error("Maximum 250 variantes par opération.");
  await prisma.$transaction(async tx => {
    let product = await tx.product.findUnique({where:{sku:data.sku}});
    if (!product) product = await tx.product.create({data:{sku:data.sku,name:data.name,category:data.category}});
    else if (product.name !== data.name) throw new Error("Cette référence produit existe déjà avec un autre nom.");
    for (const size of sizes) for (const color of colors) {
      const rawQty = formData.get(`qty_${size}_${color}`);
      const qty = z.coerce.number().int().nonnegative().max(100000).parse(rawQty ?? 0);
      const variantSku = `${data.sku}-${size}-${color}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9-]/g,"-").replace(/-+/g,"-").slice(0,80);
      let variant = await tx.variant.findUnique({where:{sku:variantSku}});
      if (!variant) variant = await tx.variant.create({data:{sku:variantSku,productId:product.id,model:data.model,size,color,unitPrice:data.unitPrice,purchasePrice:data.purchasePrice,stockOnHand:qty,alertAt:data.alertAt}});
      else {
        if (variant.productId !== product.id || variant.size !== size || variant.color !== color) throw new Error(`Référence variante déjà utilisée : ${variantSku}`);
        if (qty > 0) variant = await tx.variant.update({where:{id:variant.id},data:{stockOnHand:{increment:qty},unitPrice:data.unitPrice,purchasePrice:data.purchasePrice,alertAt:data.alertAt}});
      }
      if (qty > 0) await tx.stockMovement.create({data:{variantId:variant.id,userId:actor.id,type:StockMovementType.RECEIPT,quantity:qty,reason:"Inventaire initial / entrée de stock"}});
    }
    await tx.auditLog.create({data:{userId:actor.id,action:"INITIAL_INVENTORY",entity:"Product",entityId:product.id,details:{sizes,colors}}});
  });
  revalidatePath("/inventory-initial"); revalidatePath("/products"); revalidatePath("/stock"); redirect("/inventory-initial?success=1");
}

export async function createOrderAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.SALES]);
  const lineVariantIds = formData.getAll("variantId").map(v => String(v || "")).filter(Boolean);
  const lineQuantitiesRaw = formData.getAll("quantity");
  const data = z.object({
    customerName: z.string().min(2), phone: z.string().min(5), address: z.string().min(4),
    destination: z.nativeEnum(Destination), deliveryFee: z.coerce.number().int().nonnegative(),
    discount: z.coerce.number().int().nonnegative(), notes: z.string().optional()
  }).parse({
    customerName: formData.get("customerName"), phone: formData.get("phone"), address: formData.get("address"),
    destination: formData.get("destination"), deliveryFee: formData.get("deliveryFee") || 0,
    discount: formData.get("discount") || 0, notes: formData.get("notes") || ""
  });
  const linesInput = lineVariantIds.map((variantId, i) => ({variantId, quantity: z.coerce.number().int().positive().max(1000).parse(lineQuantitiesRaw[i])}));
  if (!linesInput.length) throw new Error("Ajoutez au moins un article à la commande.");
  if (new Set(linesInput.map(x=>x.variantId)).size !== linesInput.length) throw new Error("Un article est présent plusieurs fois. Regroupez sa quantité sur une seule ligne.");
  const order = await prisma.$transaction(async tx => {
    const variants = await tx.variant.findMany({where:{id:{in:linesInput.map(x=>x.variantId)}}});
    if (variants.length !== linesInput.length) throw new Error("Un des articles sélectionnés est introuvable.");
    let subtotal = 0;
    for (const line of linesInput) {
      const variant = variants.find(v=>v.id===line.variantId)!;
      const available = variant.stockOnHand - variant.stockReserved;
      if (available < line.quantity) throw new Error(`Stock insuffisant pour ${variant.sku}. Disponible : ${available}`);
      subtotal += variant.unitPrice * line.quantity;
    }
    if (data.discount > subtotal + data.deliveryFee) throw new Error("La remise ne peut pas dépasser le montant total.");
    const city = data.destination === Destination.TANA ? "Antananarivo" : "Province";
    let customer = await tx.customer.findFirst({where:{phone:data.phone}});
    if (!customer) customer = await tx.customer.create({data:{name:data.customerName,phone:data.phone,address:data.address,city}});
    else if (customer.name !== data.customerName || customer.address !== data.address) customer = await tx.customer.update({where:{id:customer.id},data:{name:data.customerName,address:data.address}});
    const count = await tx.order.count();
    const number = `AP-${new Date().getFullYear()}-${String(count + 1).padStart(5,"0")}`;
    const total = Math.max(0, subtotal + data.deliveryFee - data.discount);
    const created = await tx.order.create({data:{
      number,customerId:customer.id,salesUserId:actor.id,destination:data.destination,deliveryAddress:data.address,
      status:OrderStatus.CONFIRMED,paymentStatus:PaymentStatus.UNPAID,subtotal,deliveryFee:data.deliveryFee,discount:data.discount,total,notes:data.notes,
      lines:{create:linesInput.map(line=>{const variant=variants.find(v=>v.id===line.variantId)!;return {variantId:variant.id,quantity:line.quantity,unitPrice:variant.unitPrice,lineTotal:variant.unitPrice*line.quantity};})}
    }});
    for (const line of linesInput) {
      await tx.variant.update({where:{id:line.variantId},data:{stockReserved:{increment:line.quantity}}});
      await tx.stockMovement.create({data:{variantId:line.variantId,userId:actor.id,type:StockMovementType.RESERVATION,quantity:line.quantity,reason:`Réservation pour ${number}`,orderId:created.id}});
    }
    await tx.auditLog.create({data:{userId:actor.id,action:"CREATE_ORDER",entity:"Order",entityId:created.id,details:{number,lines:linesInput.length}}});
    return created;
  });
  revalidatePath("/orders"); revalidatePath("/stock"); redirect(`/orders?created=${encodeURIComponent(order.number)}`);
}
export async function invoiceOrderAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.BILLING]);
  const orderId = String(formData.get("orderId") || "");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { invoice: true } });
  if (!order || order.invoice) redirect("/invoices?error=invoice");
  const number = `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
  await prisma.$transaction(async tx => {
    await tx.invoice.create({ data: { number, orderId: order.id, total: order.total } });
    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.INVOICED } });
    await tx.parcel.upsert({ where: { orderId: order.id }, create: { orderId: order.id, destination: order.destination }, update: {} });
    await tx.feedback.create({ data: { orderId: order.id, team: order.destination, status: FeedbackStatus.TO_CONTACT } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CREATE_INVOICE", entity: "Order", entityId: order.id, details: { number } } });
  });
  revalidatePath("/invoices"); revalidatePath("/orders"); revalidatePath("/dispatch"); revalidatePath("/feedback");
}
export async function addPaymentAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.BILLING]);
  const invoiceId = String(formData.get("invoiceId") || "");
  const amount = z.coerce.number().int().positive().parse(formData.get("amount"));
  const method = z.string().min(2).parse(formData.get("method"));
  const reference = String(formData.get("reference") || "");
  await prisma.$transaction(async tx => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { order: true, payments: true } });
    if (!invoice) throw new Error("Facture introuvable.");
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (paid + amount > invoice.total) throw new Error("Le paiement dépasse le solde de la facture.");
    await tx.payment.create({ data: { invoiceId, amount, method, reference } });
    const newPaid = paid + amount;
    await tx.invoice.update({ where: { id: invoiceId }, data: { amountPaid: newPaid } });
    await tx.order.update({ where: { id: invoice.orderId }, data: { paymentStatus: newPaid === invoice.total ? PaymentStatus.PAID : PaymentStatus.PARTIAL } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "ADD_PAYMENT", entity: "Invoice", entityId: invoiceId, details: { amount, method } } });
  });
  revalidatePath("/invoices"); revalidatePath("/orders");
}
export async function updateParcelAction(formData: FormData) {
  const actor = await currentUser();
  if (!actor) throw new Error("UNAUTHENTICATED");
  const parcelId = String(formData.get("parcelId") || "");
  const status = z.nativeEnum(ParcelStatus).parse(formData.get("status"));
  const carrier = String(formData.get("carrier") || "");
  const trackingCode = String(formData.get("trackingCode") || "");
  const parcel = await prisma.parcel.findUnique({ where: { id: parcelId }, include: { order: { include: { lines: true } } } });
  if (!parcel) throw new Error("Colis introuvable.");
  const allowed: Record<Role, ParcelStatus[]> = {
    ADMIN: Object.values(ParcelStatus), MANAGER: Object.values(ParcelStatus),
    SALES: [], BILLING: [], WAREHOUSE: [ParcelStatus.TO_PREPARE, ParcelStatus.PREPARING, ParcelStatus.READY],
    DISPATCH_TANA: parcel.destination === Destination.TANA ? Object.values(ParcelStatus) : [],
    DISPATCH_PROVINCE: parcel.destination === Destination.PROVINCE ? Object.values(ParcelStatus) : [],
    FEEDBACK_TANA: [], FEEDBACK_PROVINCE: []
  };
  if (!allowed[actor.role].includes(status)) throw new Error("Action non autorisée pour ce rôle ou ce circuit.");
  await prisma.$transaction(async tx => {
    const fresh = await tx.parcel.findUnique({ where: { id: parcelId }, include: { order: { include: { lines: true } } } });
    if (!fresh) throw new Error("Colis introuvable.");
    const update: any = { status, carrier: carrier || null, trackingCode: trackingCode || null };
    if (status === ParcelStatus.READY) update.packedAt = fresh.packedAt || new Date();
    if (status === ParcelStatus.DISPATCHED && !fresh.dispatchedAt) update.dispatchedAt = new Date();
    if (status === ParcelStatus.DELIVERED) update.deliveredAt = fresh.deliveredAt || new Date();

    // La sortie physique est effectuée une seule fois au magasin (READY), jamais au dispatch.
    let performStockIssue = false;
    if (status === ParcelStatus.READY && !fresh.stockIssuedAt) {
      const claim = await tx.parcel.updateMany({ where: { id: parcelId, stockIssuedAt: null }, data: { stockIssuedAt: new Date(), status: ParcelStatus.READY, packedAt: fresh.packedAt || new Date() } });
      performStockIssue = claim.count === 1;
    }
    if (performStockIssue) {
      for (const line of fresh.order.lines) {
        const variant = await tx.variant.findUnique({ where: { id: line.variantId } });
        if (!variant || variant.stockOnHand < line.quantity || variant.stockReserved < line.quantity) {
          throw new Error(`Stock insuffisant ou réservation incohérente pour la variante ${line.variantId}.`);
        }
        await tx.variant.update({ where: { id: line.variantId }, data: { stockOnHand: { decrement: line.quantity }, stockReserved: { decrement: line.quantity } } });
        await tx.stockMovement.create({ data: { variantId: line.variantId, userId: actor.id, type: StockMovementType.SALE, quantity: -line.quantity, reason: `Sortie magasin ${fresh.order.number}`, orderId: fresh.orderId } });
      }
    }
    if (status === ParcelStatus.READY && fresh.stockIssuedAt) update.stockIssuedAt = fresh.stockIssuedAt;
    await tx.parcel.update({ where: { id: parcelId }, data: update });
    if (status === ParcelStatus.DISPATCHED) await tx.order.update({ where: { id: fresh.orderId }, data: { status: OrderStatus.DISPATCHED } });
    if (status === ParcelStatus.DELIVERED) await tx.order.update({ where: { id: fresh.orderId }, data: { status: OrderStatus.DELIVERED } });
    if (status === ParcelStatus.FAILED) await tx.order.update({ where: { id: fresh.orderId }, data: { status: OrderStatus.DELIVERY_FAILED } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "UPDATE_PARCEL", entity: "Parcel", entityId: parcelId, details: { status, stockIssued: status === ParcelStatus.READY && !fresh.stockIssuedAt } } });
  });
  revalidatePath("/dispatch"); revalidatePath("/dispatch/history"); revalidatePath("/orders"); revalidatePath("/stock");
}

export async function createDispatchSheetAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.DISPATCH_TANA, Role.DISPATCH_PROVINCE]);
  const parcelIds = [...new Set(formData.getAll("parcelId").map(v => String(v)).filter(Boolean))];
  const axis = z.string().min(2).max(120).parse(formData.get("axis"));
  const driverName = z.string().min(2).max(120).parse(formData.get("driverName"));
  if (!parcelIds.length) throw new Error("Sélectionnez au moins un colis sorti du magasin.");
  const sheet = await prisma.$transaction(async tx => {
    const parcels = await tx.parcel.findMany({ where: { id: { in: parcelIds } }, include: { dispatchItems: true } });
    if (parcels.length !== parcelIds.length) throw new Error("Un colis sélectionné est introuvable.");
    for (const parcel of parcels) {
      if (!parcel.stockIssuedAt) throw new Error("Seuls les colis dont la sortie magasin est enregistrée peuvent être assemblés.");
      if ([ParcelStatus.DISPATCHED, ParcelStatus.IN_TRANSIT, ParcelStatus.DELIVERED].includes(parcel.status)) throw new Error("Un colis déjà expédié ne peut pas être ajouté à une nouvelle fiche.");
      const existing = await tx.dispatchSheetItem.findUnique({ where: { parcelId: parcel.id } });
      if (existing) throw new Error("Un colis sélectionné figure déjà dans l'historique d'assemblage. Consultez l'historique avant de continuer.");
      if (actor.role === Role.DISPATCH_TANA && parcel.destination !== Destination.TANA) throw new Error("Ce compte ne peut assembler que le circuit Tana.");
      if (actor.role === Role.DISPATCH_PROVINCE && parcel.destination !== Destination.PROVINCE) throw new Error("Ce compte ne peut assembler que le circuit Province.");
    }
    const count = await tx.dispatchSheet.count();
    const sheetNumber = `AP-LIV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    return tx.dispatchSheet.create({ data: { sheetNumber, axis, driverName, createdById: actor.id, items: { create: parcelIds.map(parcelId => ({ parcelId })) } } });
  });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "CREATE_DISPATCH_SHEET", entity: "DispatchSheet", entityId: sheet.id, details: { axis, driverName, parcelIds } } });
  revalidatePath("/dispatch"); revalidatePath("/dispatch/history");
  redirect(`/dispatch/history/${sheet.id}`);
}
export async function updateFeedbackAction(formData: FormData) {
  const actor = await currentUser();
  if (!actor) throw new Error("UNAUTHENTICATED");
  const feedbackId = String(formData.get("feedbackId") || "");
  const status = z.nativeEnum(FeedbackStatus).parse(formData.get("status"));
  const result = String(formData.get("result") || "");
  const nextAction = String(formData.get("nextAction") || "");
  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback) throw new Error("Dossier introuvable.");
  const allowed = actor.role === Role.ADMIN || actor.role === Role.MANAGER ||
    (actor.role === Role.FEEDBACK_TANA && feedback.team === Destination.TANA) ||
    (actor.role === Role.FEEDBACK_PROVINCE && feedback.team === Destination.PROVINCE);
  if (!allowed) throw new Error("Accès interdit à ce dossier.");
  await prisma.feedback.update({ where: { id: feedbackId }, data: { status, result, nextAction, contactedAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "UPDATE_FEEDBACK", entity: "Feedback", entityId: feedbackId, details: { status } } });
  revalidatePath("/feedback");
}


export async function updateDispatchFeedbackAction(formData: FormData) {
  const actor = await requireRoles([Role.ADMIN, Role.MANAGER, Role.FEEDBACK_TANA, Role.FEEDBACK_PROVINCE]);
  const itemId = z.string().min(1).parse(String(formData.get("dispatchItemId") || ""));
  const status = z.nativeEnum(DispatchFeedbackStatus).parse(formData.get("feedbackStatus"));
  const item = await prisma.dispatchSheetItem.findUnique({ where: { id: itemId }, include: { parcel: true } });
  if (!item) throw new Error("Article assemblé introuvable.");
  if (actor.role === Role.FEEDBACK_TANA && item.parcel.destination !== Destination.TANA) throw new Error("Accès limité au circuit Tana.");
  if (actor.role === Role.FEEDBACK_PROVINCE && item.parcel.destination !== Destination.PROVINCE) throw new Error("Accès limité au circuit Province.");
  await prisma.dispatchSheetItem.update({ where: { id: itemId }, data: { feedbackStatus: status, feedbackUpdatedAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "UPDATE_DISPATCH_FEEDBACK", entity: "DispatchSheetItem", entityId: itemId, details: { status } } });
  revalidatePath("/feedback"); revalidatePath("/cashier");
}
