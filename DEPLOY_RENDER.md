# Deploy to Render

1. In Render, create a Blueprint from this repository and select the branch to deploy. The `render.yaml` blueprint creates a free Node web service.
2. When prompted, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_PROJECT_ID` to the values for your Supabase project. Set the Vite variables before building: they are embedded in the client bundle. Never put service-role keys in Vite variables.
3. Deploy the service. Once Render provides its HTTPS URL, add that URL as the Site URL and add the appropriate redirect URLs to the allowed redirect URL list in Supabase Authentication URL Configuration. Include any existing production URLs you still need. If using an external authentication provider, configure its allowed callbacks as required too.
4. Redeploy after changing build-time Vite variables.

The free service sleeps after inactivity, so the first request after sleep can take longer. Free-plan limits and availability are subject to Render's current policies.

## Post-deploy checklist

- Load the landing page and check artwork and fonts.
- Sign up and log in; confirm email and provider redirects return to the deployed site.
- Visit Homeowner and Operator pages with appropriately authorized accounts.
- Run Fault Detection image inspection and confirm the model and WebAssembly load.
- Test navigation and the above flows on mobile.
- Check browser console for blocked cross-origin resources and verify `crossOriginIsolated` is true in a supported browser. Production uses COEP `credentialless` because existing cross-origin artwork is loaded without CORS and does not send Cross-Origin-Resource-Policy; anonymous cross-origin requests omit credentials under this policy.
