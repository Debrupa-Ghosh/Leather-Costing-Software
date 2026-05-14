import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Package, Search, Plus, Save, Settings, Layers, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function BOMPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // BOM Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [bomData, setBomData] = useState({
    description: '',
    items: []
  });
  const [loadingBOM, setLoadingBOM] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [search]);

  useEffect(() => {
    if (showModal) {
      loadRawMaterials();
    }
  }, [showModal]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/?limit=100&search=${search}`);
      setProducts(res.data.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadRawMaterials = async () => {
    try {
      if (rawMaterials.length === 0) {
        const res = await api.get('/inventory/raw-materials?limit=100');
        setRawMaterials(res.data.data);
      }
    } catch {
      toast.error('Failed to load raw materials');
    }
  };

  const openBOMModal = async (product) => {
    setSelectedProduct(product);
    setShowModal(true);
    setLoadingBOM(true);
    
    try {
      const res = await api.get(`/products/${product.id}/bom`);
      if (res.data.data) {
        setBomData({
          description: res.data.data.description || '',
          items: res.data.data.items.map(i => ({
            raw_material_id: i.raw_material_id,
            quantity: i.quantity,
            unit: i.unit,
            wastage_percentage: i.wastage_percentage
          }))
        });
      }
    } catch (err) {
      // 404 means no BOM yet, start fresh
      if (err.response?.status === 404) {
        setBomData({
          description: '',
          items: []
        });
      } else {
        toast.error('Failed to load BOM');
      }
    } finally {
      setLoadingBOM(false);
    }
  };

  const saveBOM = async (e) => {
    e.preventDefault();
    if (bomData.items.length === 0) {
      toast.error('Please add at least one material to the BOM');
      return;
    }
    
    // Ensure all items have selected a material
    if (bomData.items.some(i => !i.raw_material_id)) {
      toast.error('Please select a material for all items');
      return;
    }

    try {
      const payload = {
        product_id: selectedProduct.id,
        description: bomData.description,
        items: bomData.items.map(i => ({
          raw_material_id: parseInt(i.raw_material_id),
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          wastage_percentage: parseFloat(i.wastage_percentage || 0)
        }))
      };
      
      await api.post('/products/bom', payload);
      toast.success('BOM saved successfully');
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save BOM');
    }
  };

  const addBOMItem = () => {
    setBomData(prev => ({
      ...prev,
      items: [...prev.items, { raw_material_id: '', quantity: 1, unit: '', wastage_percentage: 5 }]
    }));
  };

  const removeBOMItem = (index) => {
    setBomData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateBOMItem = (index, field, value) => {
    const updatedItems = [...bomData.items];
    updatedItems[index][field] = value;
    
    // Auto-fill unit if material is selected
    if (field === 'raw_material_id') {
      const material = rawMaterials.find(m => m.id === parseInt(value));
      if (material) {
        updatedItems[index].unit = material.unit;
      }
    }
    
    setBomData(prev => ({ ...prev, items: updatedItems }));
  };

  return (
    <AppLayout title="Bill of Materials">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Bill of Materials (BOM)</h2>
          <p>Define material recipes and consumption for your products.</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px', maxWidth: '300px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search products..." 
          style={{ paddingLeft: '38px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No products found. Add products first.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.sku}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.category || 'N/A'}</td>
                  <td>${p.selling_price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openBOMModal(p)}>
                      <Layers size={14} style={{ marginRight: '6px' }} /> Manage BOM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div className="modal" style={{ maxWidth: '800px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">BOM: {selectedProduct.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {loadingBOM ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading BOM configuration...</div>
            ) : (
              <form onSubmit={saveBOM}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">BOM Description / Version Notes</label>
                  <input type="text" className="form-control" placeholder="e.g. Standard Summer 2026 Build" value={bomData.description} onChange={e => setBomData({ ...bomData, description: e.target.value })} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Materials Required</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addBOMItem}>
                    <Plus size={14} style={{ marginRight: '6px' }} /> Add Material
                  </button>
                </div>
                
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', minHeight: '100px', maxHeight: '400px', overflowY: 'auto' }}>
                  {bomData.items.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      No materials added to this BOM yet.<br/>
                      Click "Add Material" to define the recipe.
                    </div>
                  ) : (
                    bomData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 40px', gap: '10px', marginBottom: idx === bomData.items.length - 1 ? 0 : '12px', alignItems: 'end', background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Raw Material</label>
                          <select className="form-control" required value={item.raw_material_id} onChange={e => updateBOMItem(idx, 'raw_material_id', e.target.value)}>
                            <option value="">Select Material...</option>
                            {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name} ({rm.code})</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Quantity</label>
                          <input type="number" step="0.001" min="0" className="form-control" required value={item.quantity} onChange={e => updateBOMItem(idx, 'quantity', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Unit</label>
                          <input type="text" className="form-control" value={item.unit} onChange={e => updateBOMItem(idx, 'unit', e.target.value)} readOnly style={{ background: 'transparent' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Wastage %</label>
                          <input type="number" step="0.1" min="0" className="form-control" value={item.wastage_percentage} onChange={e => updateBOMItem(idx, 'wastage_percentage', e.target.value)} />
                        </div>
                        <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)', padding: '8px' }} onClick={() => removeBOMItem(idx)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={16} style={{ marginRight: '6px' }} /> Save BOM Configuration</button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
