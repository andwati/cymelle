import {FareCalculatorCard} from "#/components/dashboard/FareCalculatorCard";
import {InventoryView} from "#/components/dashboard/InventoryView";
import {OrderHistoryView} from "#/components/dashboard/OrderHistoryView";
import {cn} from "#/lib/utils";
import {Boxes, ClipboardList} from "lucide-react";
import {useState} from "react";

type Tab = "inventory" | "history";

export function Dashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("inventory");

    return (
        <main className="min-h-screen bg-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <header className="mb-6">
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                        Ops Dashboard
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-slate-950">
                        Order Management + Fare Engine
                    </h1>
                    <p className="mt-2 max-w-2xl text-slate-600">
                        Monitor stock levels, review order history, cancel orders with stock
                        rollback, and calculate trip fares.
                    </p>
                </header>

                <div className="mb-6">
                    <FareCalculatorCard/>
                </div>

                <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <TabButton
                        active={activeTab === "inventory"}
                        onClick={() => setActiveTab("inventory")}
                        icon={<Boxes size={16}/>}
                    >
                        Inventory
                    </TabButton>

                    <TabButton
                        active={activeTab === "history"}
                        onClick={() => setActiveTab("history")}
                        icon={<ClipboardList size={16}/>}
                    >
                        Trip / Order History
                    </TabButton>
                </div>

                {activeTab === "inventory" ? <InventoryView/> : <OrderHistoryView/>}
            </div>
        </main>
    );
}

type TabButtonProps = {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
};

function TabButton({active, onClick, icon, children}: TabButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
        >
            {icon}
            {children}
        </button>
    );
}