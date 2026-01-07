// src/pages/Dashboard.jsx
import { Card } from "antd";
import MainLayout from "../components/MainLayout";

const Dashboard = () => {
    return (
        <MainLayout>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white p-4 rounded shadow">Card 1</Card>
                <Card className="bg-white p-4 rounded shadow">Card 2</Card>
                <Card className="bg-white p-4 rounded shadow">Card 3</Card>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
