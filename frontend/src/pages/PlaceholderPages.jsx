import AppLayout from '../components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Package, BarChart3, Users, ShoppingCart } from 'lucide-react';

const placeholder = (title, description, Icon) => () => (
  <AppLayout title={title}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', maxWidth: 480 }}
      >
        <div style={{ width: 80, height: 80, background: 'rgba(211,84,0,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon size={36} color="var(--accent)" />
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', marginBottom: '12px' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>{description}</p>
        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(211,84,0,0.06)', borderRadius: '12px', border: '1px solid rgba(211,84,0,0.15)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          🚀 This module is connected to the backend and ready for data entry.
        </div>
      </motion.div>
    </div>
  </AppLayout>
);

export const ProductsPage = placeholder('Products & Costing', 'Manage your leather product catalog, calculate costs with the AI costing engine, and set profit margins.', Package);
export const OrdersPage = placeholder('Order Management', 'Track sales orders, purchase orders, export orders, shipments, and payments in one place.', ShoppingCart);
export const CustomersPage = placeholder('Customer Management', 'Manage your customer database, order history, payment records, and credit limits.', Users);
export const SuppliersPage = placeholder('Supplier Management', 'Evaluate supplier performance, track purchases, and get AI-powered supplier recommendations.', Users);
export const QualityPage = placeholder('Quality Control', 'Run quality inspections, track defects, manage rejections, and generate QC reports.', BarChart3);
export const ReportsPage = placeholder('Reports & Analytics', 'Generate comprehensive reports for costing, P&L, inventory, production, and AI predictions.', BarChart3);
export const BOMPage = placeholder('Bill of Materials', 'Define multi-level BOMs, track material consumption, and auto-calculate costs from recipes.', Package);
export const WarehousePage = placeholder('Warehouse Management', 'Manage warehouses, track stock locations, and perform stock transfers between locations.', Package);
export const SettingsPage = placeholder('System Settings', 'Configure user roles, permissions, currencies, notifications, and system preferences.', BarChart3);
