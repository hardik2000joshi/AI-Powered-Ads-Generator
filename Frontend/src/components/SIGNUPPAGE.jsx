import { SignUp } from "@clerk/react"
export  const SIGNUPPAGE = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/loginHomePage"
            fallbackRedirectUrl="/loginHomePage"
            appearance={{
                elements: {
                    card: "shadow-2xl",
                },
            }}
            />
        </div>
    )
}
