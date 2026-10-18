-- Ajoute le statut de feedback sur chaque colis/fiche assemblée sans supprimer les données existantes.
CREATE TYPE "DispatchFeedbackStatus" AS ENUM ('TO_DELIVER', 'SOLD', 'RETURN');
ALTER TABLE "DispatchSheetItem"
  ADD COLUMN "feedbackStatus" "DispatchFeedbackStatus" NOT NULL DEFAULT 'TO_DELIVER',
  ADD COLUMN "feedbackUpdatedAt" TIMESTAMP(3);
