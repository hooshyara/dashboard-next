'use client'

// Import components
import { Button } from "@/components/ui/button";
import Link from "next/link";

const LoginPage = () => {
    const host = process.env.NEXT_PUBLIC_REDIRECT_URL;

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="flex flex-col gap-4 h-max w-84 max-w-full border p-8 rounded-xl">
                <div>
                    <h2 className="text-xl">به پنل مدیریت خوش آمدید 👋</h2>
                    <p className="text-gray-400">با سیستم احراز هویت دیجیتال یکپارچه P-id وارد شوید</p>
                </div>

                <Link href={`https://p-id.ir/fa?redirectUrl=http://${host}`}><Button className="mt-2 w-full">ورود با P-ID</Button></Link>
            </div>
        </div>
    )
}

export default LoginPage;