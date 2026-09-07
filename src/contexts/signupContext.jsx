import { useContext, createContext, useState } from "react";

const SignupContext = createContext(null);

export const SignupProvider = ({ children }) => {
    const [signUpData, setSignUpData] = useState({
        fullname: "",
        email: "",
        phone_number: "",
        role: "",
        password: "",
        profile_image: "http://localhost:8000/static/images/profileimg.avif"
    })

    return (
        <SignupContext.Provider value={{ signUpData, setSignUpData}}>
            {children}
        </SignupContext.Provider>
    );
}

export const useSignup = () => useContext(SignupContext);