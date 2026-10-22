import { SignIn, UserButton, SignOutButton} from "@clerk/react"
export function SIGNINPAGE(){
    return(
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0b12] p-4">
            <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
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