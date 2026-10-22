
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {ClerkProvider} from "@clerk/react"
import {BrowserRouter} from "react-router-dom";
import {dark} from "@clerk/themes"
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if(!PUBLISHABLE_KEY){
  throw new Error("Missing Publishable Key");
}
createRoot(document.getElementById('root')).render(
  <ClerkProvider
  appearance={{
    theme: dark,
    variables: {
      colorPrimary: '#4f39f6',
      colorTextOnPrimaryBackground: '#ffffff'
    }
  }}
  publishableKey={PUBLISHABLE_KEY}
  >
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </ClerkProvider>
)
