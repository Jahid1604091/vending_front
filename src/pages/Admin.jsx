import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "../api";
import "./Admin.css";
import noImg from "../no-image.png";

export default function Admin({isAuthenticated, onLogout}) {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: 0, quantity: 0, group_id: null, file: null });
  const [users, setUsers] = useState([]);
  const [newUserId, setNewUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupMessage, setGroupMessage] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState(null);
  const [bulkEditGroup, setBulkEditGroup] = useState(null);
  const [bulkForm, setBulkForm] = useState({ name: "", price: "" });
  const [activeTab, setActiveTab] = useState("products");
  const backendUrl = process.env.REACT_APP_API_URL;

  const fetchProducts = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setAdminMessage("Unauthorized: Please log in again");
        return;
      }
      const res = await api.get("/api/products/all");
      setProducts(res.data);
      setAdminMessage("");
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setAdminMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Failed to fetch products"
      );
    }
  };

  const fetchGroups = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setGroupMessage("Unauthorized: Please log in again");
        return;
      }
      const res = await api.get("/api/groups");
      setGroups(res.data.groups || []);
      setGroupMessage("");
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setGroupMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Failed to fetch groups"
      );
    }
  };

  const fetchUsers = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setUserMessage("Unauthorized: Please log in again");
        return;
      }
      const res = await api.get("/api/users");
      setUsers(res.data);
      setUserMessage("");
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUserMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Failed to fetch users"
      );
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchGroups();
    fetchUsers();
  }, []);

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ 
      name: p.name, 
      price: p.price, 
      quantity: p.quantity, 
      group_id: p.group_id || null,
      file: null 
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => setForm({ ...form, file: acceptedFiles[0] }),
  });

  const saveEdit = async (id) => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setAdminMessage("Unauthorized: Please log in again");
        return;
      }
      await api.put(`/api/products/${id}`, {
        name: form.name,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        group_id: form.group_id || null,
      });

      if (form.file) {
        const formData = new FormData();
        formData.append("image", form.file);
        const res = await api.post(`/api/products/${id}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setEditing(null);
      setForm({ name: "", price: 0, quantity: 0, group_id: null, file: null });
      setAdminMessage(`Product ${id} updated successfully`);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to update product:", err);
      setAdminMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again. Ensure you are logged in and try again."
          : err.response?.data?.error || `Failed to update product ${id}: ${err.message}`
      );
    }
  };

  const addUser = async () => {
    if (!newUserId || !newUserName) {
      setUserMessage("User ID and Name are required");
      return;
    }

    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setUserMessage("Unauthorized: Please log in again");
        return;
      }
      await api.post("/api/users", { userid: newUserId, name: newUserName });
      setNewUserId("");
      setNewUserName("");
      setUserMessage("User added successfully");
      fetchUsers();
    } catch (err) {
      console.error("Failed to add user:", err);
      setUserMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Failed to add user"
      );
    }
  };

  const deleteUser = async (userid) => {
    if (!window.confirm(`Are you sure you want to delete user ${userid}?`)) {
      return;
    }

    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setUserMessage("Unauthorized: Please log in again");
        return;
      }
      await api.delete(`/api/users/${userid}`);
      setUserMessage(`User ${userid} deleted successfully`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setUserMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || `Failed to delete user ${userid}`
      );
    }
  };

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    setAdminMessage("");

    if (newPassword !== confirmPassword) {
      setAdminMessage("New password and confirm password do not match");
      return;
    }

    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setAdminMessage("Unauthorized: Please log in again");
        return;
      }
      const res = await api.put("/api/admin", {
        currentPassword,
        newUsername,
        newPassword,
      });

      if (res.data.success) {
        setAdminMessage("Admin details updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setNewUsername("");
        if (newUsername) {
          localStorage.setItem("username", newUsername);
        }
      } else {
        setAdminMessage(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Failed to update admin:", err);
      setAdminMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Update failed. Check current password."
      );
    }
  };

  const saveGroup = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setGroupMessage("Unauthorized: Please log in again");
        return;
      }

      if (editingGroup) {
        await api.put(`/api/groups/${editingGroup}`, groupForm);
        setGroupMessage("Group updated successfully");
      } else {
        await api.post("/api/groups", groupForm);
        setGroupMessage("Group added successfully");
      }

      setGroupForm({ name: "", description: "" });
      setEditingGroup(null);
      setShowGroupForm(false);
      fetchGroups();
      fetchProducts();
    } catch (err) {
      console.error("Failed to save group:", err);
      setGroupMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Failed to save group"
      );
    }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group? Products in this group will become ungrouped.")) {
      return;
    }

    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setGroupMessage("Unauthorized: Please log in again");
        return;
      }
      await api.delete(`/api/groups/${id}`);
      setGroupMessage("Group deleted successfully");
      fetchGroups();
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete group:", err);
      setGroupMessage(
        err.response?.status === 401
          ? "Unauthorized: Please log in again"
          : err.response?.data?.error || "Failed to delete group"
      );
    }
  };

  const startEditGroup = (group) => {
    setEditingGroup(group.id);
    setGroupForm({ name: group.name, description: group.description || "" });
    setShowGroupForm(true);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllInGroup = (groupId) => {
    const groupProducts = products.filter(p => p.group_id === groupId);
    const groupProductIds = groupProducts.map(p => p.id);
    setSelectedProducts(prev => {
      const allSelected = groupProductIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !groupProductIds.includes(id));
      } else {
        return [...new Set([...prev, ...groupProductIds])];
      }
    });
  };

  const assignToGroup = async (groupId) => {
    if (selectedProducts.length === 0) {
      setGroupMessage("No products selected");
      return;
    }

    try {
      const res = await api.post(`/api/groups/${groupId}/assign`, {
        productIds: selectedProducts
      });
      setGroupMessage(res.data.message);
      setSelectedProducts([]);
      setShowAssignModal(false);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to assign products:", err);
      setGroupMessage(err.response?.data?.error || "Failed to assign products");
    }
  };

  const removeFromGroup = async () => {
    if (selectedProducts.length === 0) {
      setGroupMessage("No products selected");
      return;
    }

    try {
      const res = await api.post(`/api/groups/unassign`, {
        productIds: selectedProducts
      });
      setGroupMessage(res.data.message);
      setSelectedProducts([]);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to remove products:", err);
      setGroupMessage(err.response?.data?.error || "Failed to remove products");
    }
  };

  const bulkUpdateProducts = async (groupId) => {
    const groupProducts = products.filter(p => p.group_id === groupId);
    const productIds = groupProducts.map(p => p.id);

    if (productIds.length === 0) {
      setGroupMessage("No products in this group");
      return;
    }

    try {
      const updates = {};
      if (bulkForm.name) updates.name = bulkForm.name;
      if (bulkForm.price) updates.price = parseFloat(bulkForm.price);

      const res = await api.put(`/api/groups/${groupId}/products`, {
        productIds,
        ...updates
      });
      setGroupMessage(res.data.message);
      setBulkEditGroup(null);
      setBulkForm({ name: "", price: "" });
      await fetchProducts();
    } catch (err) {
      console.error("Failed to bulk update:", err);
      setGroupMessage(err.response?.data?.error || "Failed to bulk update products");
    }
  };

  const groupedProducts = {};
  const ungroupedProducts = [];

  products.forEach((product) => {
    if (product.group_id) {
      if (!groupedProducts[product.group_id]) {
        groupedProducts[product.group_id] = [];
      }
      groupedProducts[product.group_id].push(product);
    } else {
      ungroupedProducts.push(product);
    }
  });

  const renderProductRow = (p, showCheckbox = false) => {
    const isSelected = selectedProducts.includes(p.id);
    
    return (
      <tr key={p.id} className={isSelected ? "selected-row" : ""}>
        {showCheckbox && (
          <td>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleProductSelection(p.id)}
              className="checkbox-input"
            />
          </td>
        )}
        <td><span className="product-id-badge">{p.id}</span></td>
        <td>
          {editing === p.id ? (
            <div className="dropzone-wrapper">
              <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                {form.file ? (
                  <div className="file-preview">
                    <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>{form.file.name}</p>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p>Drop image or click</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <img
              src={p.image ? `${backendUrl}${p.image}?t=${Date.now()}` : noImg}
              alt={p.name}
              className="admin-image"
              onError={(e) => {
                console.error(`Image failed to load: ${p.image}`);
                e.target.src = noImg;
              }}
            />
          )}
        </td>
        <td>
          {editing === p.id ? (
            <input
              className="edit-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Product name"
            />
          ) : (
            <span className="product-name">{p.name}</span>
          )}
        </td>
        <td>
          {editing === p.id ? (
            <input
              className="edit-input edit-input-number"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
            />
          ) : (
            <span className="product-price">৳{p.price}</span>
          )}
        </td>
        <td>
          {editing === p.id ? (
            <input
              className="edit-input edit-input-number"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
            />
          ) : (
            <span className={`stock-badge ${p.quantity > 10 ? 'stock-high' : p.quantity > 0 ? 'stock-medium' : 'stock-low'}`}>
              {p.quantity}
            </span>
          )}
        </td>
        <td>
          {editing === p.id ? (
            <select
              className="edit-select"
              value={form.group_id || ""}
              onChange={(e) => setForm({ ...form, group_id: e.target.value ? parseInt(e.target.value) : null })}
            >
              {/* <option value="">No Group</option> */}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="group-tag">
              {groups.find((g) => g.id === p.group_id)?.name || "No Group"}
            </span>
          )}
        </td>
        <td>
          {editing === p.id ? (
            <div className="action-buttons">
              <button className="btn btn-save" onClick={() => saveEdit(p.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                Save
              </button>
              <button className="btn btn-cancel" onClick={() => setEditing(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ) : (
            <button className="btn btn-edit" onClick={() => startEdit(p)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your vending machine inventory, groups, and users</p>
        {isAuthenticated && <button onClick={onLogout}>Logout</button>}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          Products & Groups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Settings
        </button>
      </div>

      {/* Products & Groups Tab */}
      {activeTab === 'products' && (
        <div className="tab-content">
          {/* Groups Management Card */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>Product Groups</h2>
                <p>Organize products into logical groups</p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowGroupForm(!showGroupForm);
                  setEditingGroup(null);
                  setGroupForm({ name: "", description: "" });
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
                {showGroupForm ? "Cancel" : "Add Group"}
              </button>
            </div>

            {showGroupForm && (
              <div className="group-form-card">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Group Name</label>
                    <input
                      type="text"
                      placeholder="Enter group name"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Enter description (optional)"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-success"
                  onClick={saveGroup} 
                  disabled={!groupForm.name}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  {editingGroup ? "Update Group" : "Save Group"}
                </button>
              </div>
            )}

            {groupMessage && (
              <div className={`alert ${groupMessage.includes("successfully") ? "alert-success" : "alert-error"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {groupMessage.includes("successfully") ? (
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  ) : (
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  )}
                </svg>
                <span>{groupMessage}</span>
              </div>
            )}

            {groups.length > 0 && (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Springs</th>
                      <th>Total Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => {
                      const groupProducts = groupedProducts[group.id] || [];
                      const totalStock = groupProducts.reduce((sum, p) => sum + p.quantity, 0);
                  
                      return (
                        <tr key={group.id}>
                          <td><span className="product-id-badge">{group.id}</span></td>
                          <td><strong>{group.name}</strong></td>
                          <td>{group.description || "-"}</td>
                          <td><span className="info-badge">{groupProducts.length}</span></td>
                          <td><span className="stock-badge stock-high">{totalStock}</span></td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn btn-sm btn-edit" 
                                onClick={() => startEditGroup(group)}
                                title="Edit group"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                              <button 
                                className="btn btn-sm btn-primary" 
                                onClick={() => setBulkEditGroup(group.id)}
                                title="Bulk edit"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                              </button>
                              <button 
                                className="btn btn-sm btn-danger" 
                                onClick={() => deleteGroup(group.id)}
                                title="Delete group"
                                disabled={groupProducts?.length}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selection Actions */}
          {selectedProducts.length > 0 && (
            <div className="selection-actions">
              <div className="selection-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                <strong>{selectedProducts.length} product(s) selected</strong>
              </div>
              <div className="selection-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAssignModal(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                  </svg>
                  Assign to Group
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={removeFromGroup}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Remove from Group
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSelectedProducts([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Assign Modal */}
          {showAssignModal && (
            <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Assign Products to Group</h3>
                  <button 
                    className="modal-close"
                    onClick={() => setShowAssignModal(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <p>Select a group to assign {selectedProducts.length} product(s):</p>
                  <select 
                    value={targetGroupId || ""}
                    onChange={(e) => setTargetGroupId(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value="">Select a group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAssignModal(false);
                      setTargetGroupId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => targetGroupId && assignToGroup(targetGroupId)}
                    disabled={!targetGroupId}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Management */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>Product Inventory</h2>
                <p>Manage your product spring wise</p>
              </div>
            </div>

            {adminMessage && (
              <div className={`alert ${adminMessage.includes("successfully") ? "alert-success" : "alert-error"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {adminMessage.includes("successfully") ? (
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  ) : (
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  )}
                </svg>
                <span>{adminMessage}</span>
              </div>
            )}

            {groups.map((group) => {
              const groupProducts = groupedProducts[group.id] || [];
              if (groupProducts.length === 0) return null;

              const allSelected = groupProducts.every(p => selectedProducts.includes(p.id));
              
              return (
                <div key={group.id} className="product-group-section">
                  <div className="group-section-header">
                    <div className="group-info">
                      <h3>{group.name}</h3>
                      {group.description && <p>{group.description}</p>}
                    </div>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => selectAllInGroup(group.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        {allSelected ? (
                          <path d="M5 13l4 4L19 7"/>
                        ) : (
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        )}
                      </svg>
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {bulkEditGroup === group.id && (
                    <div className="bulk-edit-card">
                      <h4>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Bulk Update: {group.name}
                      </h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>New Name (optional)</label>
                          <input
                            type="text"
                            placeholder="Leave empty to skip"
                            value={bulkForm.name}
                            onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>New Price (optional)</label>
                          <input
                            type="number"
                            placeholder="Leave empty to skip"
                            value={bulkForm.price}
                            onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                            className="form-input"
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button 
                          className="btn btn-success"
                          onClick={() => bulkUpdateProducts(group.id)}
                          disabled={!bulkForm.name && !bulkForm.price}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"/>
                          </svg>
                          Apply to All Springs
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => {
                            setBulkEditGroup(null);
                            setBulkForm({ name: "", price: "" });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>
                            <input 
                              type="checkbox" 
                              checked={allSelected}
                              onChange={() => selectAllInGroup(group.id)}
                              className="checkbox-input"
                            />
                          </th>
                          <th>Spring ID</th>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Group</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupProducts.map(p => renderProductRow(p, true))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {ungroupedProducts.length > 0 && (
              <div className="product-group-section">
                <div className="group-section-header">
                  <div className="group-info">
                    <h3>Ungrouped Products</h3>
                    <p>Products not assigned to any group</p>
                  </div>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const ungroupedIds = ungroupedProducts.map(p => p.id);
                      const allSelected = ungroupedIds.every(id => selectedProducts.includes(id));
                      if (allSelected) {
                        setSelectedProducts(prev => prev.filter(id => !ungroupedIds.includes(id)));
                      } else {
                        setSelectedProducts(prev => [...new Set([...prev, ...ungroupedIds])]);
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      {ungroupedProducts.every(p => selectedProducts.includes(p.id)) ? (
                        <path d="M5 13l4 4L19 7"/>
                      ) : (
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      )}
                    </svg>
                    {ungroupedProducts.every(p => selectedProducts.includes(p.id)) ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input 
                            type="checkbox" 
                            checked={ungroupedProducts.every(p => selectedProducts.includes(p.id))}
                            onChange={() => {
                              const ungroupedIds = ungroupedProducts.map(p => p.id);
                              const allSelected = ungroupedIds.every(id => selectedProducts.includes(id));
                              if (allSelected) {
                                setSelectedProducts(prev => prev.filter(id => !ungroupedIds.includes(id)));
                              } else {
                                setSelectedProducts(prev => [...new Set([...prev, ...ungroupedIds])]);
                              }
                            }}
                            className="checkbox-input"
                          />
                        </th>
                        <th>Spring ID</th>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Group</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ungroupedProducts.map(p => renderProductRow(p, true))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>User Management</h2>
                <p>Add and manage vending machine users</p>
              </div>
            </div>

            <div className="user-form-card">
              <div className="form-grid">
                <div className="form-group">
                  <label>User ID</label>
                  <input
                    type="text"
                    placeholder="Enter user ID"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>User Name</label>
                  <input
                    type="text"
                    placeholder="Enter user name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <button 
                className="btn btn-success"
                onClick={addUser} 
                disabled={!newUserId || !newUserName}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                Add User
              </button>
            </div>

            {userMessage && (
              <div className={`alert ${userMessage.includes("successfully") ? "alert-success" : "alert-error"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {userMessage.includes("successfully") ? (
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  ) : (
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  )}
                </svg>
                <span>{userMessage}</span>
              </div>
            )}

            {users.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <h3>No users yet</h3>
                <p>Add your first user to get started</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userid}>
                        <td><span className="user-id-badge">{user.userid}</span></td>
                        <td><strong>{user.name}</strong></td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => deleteUser(user.userid)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>Admin Account Settings</h2>
                <p>Update your admin credentials</p>
              </div>
            </div>

            <form onSubmit={handleAdminUpdate} className="settings-form">
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your current password"
                />
              </div>

              <div className="form-group">
                <label>New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="form-input"
                  placeholder="Leave empty to keep current username"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Confirm your new password"
                />
              </div>

              {adminMessage && (
                <div className={`alert ${adminMessage.includes("successfully") ? "alert-success" : "alert-error"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {adminMessage.includes("successfully") ? (
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    ) : (
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    )}
                  </svg>
                  <span>{adminMessage}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                Update Admin Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}