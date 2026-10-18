"use client";
import * as React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
const theme = createTheme({
  palette:{mode:"light",primary:{main:"#7c3aed",dark:"#5b21b6",light:"#a78bfa"},secondary:{main:"#db2777"},background:{default:"#f7f7fb",paper:"#fff"},success:{main:"#15803d"},warning:{main:"#b45309"},error:{main:"#b91c1c"}},
  typography:{fontFamily:'"Inter","Roboto","Arial",sans-serif',h1:{fontSize:"2rem",fontWeight:800,letterSpacing:"-.04em"},h2:{fontSize:"1.25rem",fontWeight:750},button:{textTransform:"none",fontWeight:700}},
  shape:{borderRadius:14},
  components:{MuiCard:{styleOverrides:{root:{border:"1px solid #ececf3",boxShadow:"0 4px 18px rgba(25,20,60,.04)"}}},MuiButton:{defaultProps:{disableElevation:true}}}
});
export default function Providers({children}:{children:React.ReactNode}) { return <ThemeProvider theme={theme}><CssBaseline/>{children}</ThemeProvider>; }
