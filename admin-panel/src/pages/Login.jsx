import { useState } from "react";
import { Button, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Login function
    const handleLogin = async () => {
        if (!email || !password) {
            toast.warning("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/auth/login", { email, password });
            console.log(res);
            // Save token and user info
            localStorage.setItem("token", res.data.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.data.user));

            toast.success(res.data.message);

            // Navigate to dashboard
            navigate("/dashboard");
        } catch (err) {

            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    // Optional: handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

            {/* LEFT SIDE – IMAGE */}
            <div className="hidden md:block bg-slate-900">
                <img
                    src="images/Lock.png"
                    alt="Security"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* RIGHT SIDE – LOGIN */}
            <div className="flex items-center bg-white">
                <div className="w-full px-6">

                    {/* Logo + Heading */}
                    <div className="mb-8">
                        <img
                            src="images/Logo2.png"
                            alt="Company Logo"
                            className="h-12 object-fill mb-3"
                        />
                        <h1 className="text-2xl font-semibold text-red-700">
                            Welcome To Acero
                        </h1>
                        <p className="text-gray-700">Login to access your account</p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-1">
                                Email
                            </label>
                            <Input
                                size="large"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-1">
                                Password
                            </label>
                            <Input.Password
                                size="large"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Remember Me + Forgot Password */}
                        <div className="flex items-center justify-between mb-8">
                            <label className="flex items-center text-sm text-gray-500">
                                <input
                                    type="checkbox"
                                    className="mr-2 w-4 h-4 text-red-600 accent-red-600 rounded"
                                />
                                Remember Me
                            </label>

                            <a href="#" className="text-sm text-gray-500 hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        {/* Login Button */}
                        <Button
                            block
                            size="large"
                            loading={loading}
                            onClick={handleLogin}
                            style={{
                                backgroundColor: "#b41c24",
                                borderColor: "#b41c24",
                                color: "#fff",
                            }}
                        >
                            Login
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
