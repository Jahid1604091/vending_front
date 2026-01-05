import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "../api";
import "./Admin.css";
import "./Users.css";
import noImg from "../no-image.png";

export default function Admin() {
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
  const backendUrl = process.env.REACT_APP_API_URL;

  const fetchProducts = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setAdminMessage("Unauthorized: Please log in again");
        return;
      }
      const res = await api.get("/api/products/all");
      console.log("Fetched products:", res.data);
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
        console.log(`Sending FormData for product ${id}: image=${form.file.name}`);
        const res = await api.post(`/api/products/${id}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log(`Image upload response:`, res.data);
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

  // Handle product selection
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

  // Assign selected products to group
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

  // Remove selected products from their groups
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

  // Bulk update products in a group
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

  // Group products by group_id
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
            />
          </td>
        )}
        <td>{p.id}</td>
        <td>
          {editing === p.id ? (
            <div className="dropzone-container">
              <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                {form.file ? (
                  <p>{form.file.name}</p>
                ) : (
                  <p>Drag & drop or click to select</p>
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          ) : (
            p.name
          )}
        </td>
        <td>
          {editing === p.id ? (
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          ) : (
            `৳${p.price}`
          )}
        </td>
        <td>
          {editing === p.id ? (
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          ) : (
            p.quantity
          )}
        </td>
        <td>
          {editing === p.id ? (
            <select
              value={form.group_id || ""}
              onChange={(e) => setForm({ ...form, group_id: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">No Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            groups.find((g) => g.id === p.group_id)?.name || "No Group"
          )}
        </td>
        <td>
          {editing === p.id ? (
            <button className="button-save" onClick={() => saveEdit(p.id)}>
              Save
            </button>
          ) : (
            <button className="button-edit" onClick={() => startEdit(p)}>
              Edit
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-container">
      <h2>Manage Groups</h2>
      
      {/* Selection Actions */}
      {selectedProducts.length > 0 && (
        <div style={{ 
          backgroundColor: "#e3f2fd", 
          padding: "15px", 
          marginBottom: "20px",
          borderRadius: "5px",
          border: "2px solid #2196F3"
        }}>
          <strong>{selectedProducts.length} product(s) selected</strong>
          <div style={{ marginTop: "10px" }}>
            <button 
              onClick={() => setShowAssignModal(true)}
              style={{ marginRight: "10px" }}
            >
              Assign to Group
            </button>
            <button 
              onClick={removeFromGroup}
              style={{ marginRight: "10px" }}
            >
              Remove from Group
            </button>
            <button 
              onClick={() => setSelectedProducts([])}
              className="button-delete"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            minWidth: "400px"
          }}>
            <h3>Assign {selectedProducts.length} product(s) to group:</h3>
            <select 
              value={targetGroupId || ""}
              onChange={(e) => setTargetGroupId(parseInt(e.target.value))}
              style={{ width: "100%", padding: "10px", marginTop: "15px" }}
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setTargetGroupId(null);
                }}
                style={{ marginRight: "10px" }}
              >
                Cancel
              </button>
              <button 
                onClick={() => targetGroupId && assignToGroup(targetGroupId)}
                disabled={!targetGroupId}
                className="button-save"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => {
        setShowGroupForm(!showGroupForm);
        setEditingGroup(null);
        setGroupForm({ name: "", description: "" });
      }}>
        {showGroupForm ? "Cancel" : "Add New Group"}
      </button>
      
      {showGroupForm && (
        <div className="group-form" style={{ margin: "20px 0", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
          <input
            type="text"
            placeholder="Group Name"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            style={{ marginRight: "10px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Description"
            value={groupForm.description}
            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
            style={{ marginRight: "10px", padding: "8px", width: "300px" }}
          />
          <button onClick={saveGroup} disabled={!groupForm.name}>
            {editingGroup ? "Update Group" : "Save Group"}
          </button>
        </div>
      )}

      {groupMessage && (
        <p className={groupMessage.includes("successfully") ? "success" : "error"}>{groupMessage}</p>
      )}

      {groups.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Existing Groups</h3>
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
                    <td>{group.id}</td>
                    <td>{group.name}</td>
                    <td>{group.description || "-"}</td>
                    <td>{groupProducts.length}</td>
                    <td>{totalStock}</td>
                    <td>
                      <button 
                        className="button-edit" 
                        onClick={() => startEditGroup(group)} 
                        style={{ marginRight: "5px" }}
                      >
                        Edit
                      </button>
                      <button 
                        className="button-save" 
                        onClick={() => setBulkEditGroup(group.id)}
                        style={{ marginRight: "5px" }}
                      >
                        Bulk Edit
                      </button>
                      <button 
                        className="button-delete" 
                        onClick={() => deleteGroup(group.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2>Manage Products</h2>
      
      {groups.map((group) => {
        const groupProducts = groupedProducts[group.id] || [];
        if (groupProducts.length === 0) return null;

        const allSelected = groupProducts.every(p => selectedProducts.includes(p.id));
        
        return (
          <div key={group.id} style={{ marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ display: "inline", marginRight: "15px" }}>{group.name}</h3>
                <button 
                  onClick={() => selectAllInGroup(group.id)}
                  style={{ fontSize: "12px" }}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              {group.description && (
                <p style={{ color: "#666", margin: 0 }}>{group.description}</p>
              )}
            </div>

            {/* Bulk Edit Form */}
            {bulkEditGroup === group.id && (
              <div style={{ 
                backgroundColor: "#fff3cd", 
                padding: "15px", 
                marginTop: "10px",
                borderRadius: "5px",
                border: "1px solid #ffc107"
              }}>
                <h4>Bulk Update All Springs in "{group.name}"</h4>
                <input
                  type="text"
                  placeholder="New name (leave empty to skip)"
                  value={bulkForm.name}
                  onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })}
                  style={{ marginRight: "10px", padding: "8px", width: "250px" }}
                />
                <input
                  type="number"
                  placeholder="New price (leave empty to skip)"
                  value={bulkForm.price}
                  onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                  style={{ marginRight: "10px", padding: "8px", width: "150px" }}
                />
                <button 
                  onClick={() => bulkUpdateProducts(group.id)}
                  disabled={!bulkForm.name && !bulkForm.price}
                  style={{ marginRight: "10px" }}
                >
                  Apply to All
                </button>
                <button 
                  onClick={() => {
                    setBulkEditGroup(null);
                    setBulkForm({ name: "", price: "" });
                  }}
                  className="button-delete"
                >
                  Cancel
                </button>
              </div>
            )}

            <table className="admin-table" style={{ marginTop: "10px" }}>
              <thead>
                <tr>
                  <th><input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={() => selectAllInGroup(group.id)}
                  /></th>
                  <th>Spring ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Group</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupProducts.map(p => renderProductRow(p, true))}
              </tbody>
            </table>
          </div>
        );
      })}

      {ungroupedProducts.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Ungrouped Products</h3>
            <button 
              onClick={() => {
                const ungroupedIds = ungroupedProducts.map(p => p.id);
                const allSelected = ungroupedIds.every(id => selectedProducts.includes(id));
                if (allSelected) {
                  setSelectedProducts(prev => prev.filter(id => !ungroupedIds.includes(id)));
                } else {
                  setSelectedProducts(prev => [...new Set([...prev, ...ungroupedIds])]);
                }
              }}
              style={{ fontSize: "12px" }}
            >
              {ungroupedProducts.every(p => selectedProducts.includes(p.id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th><input 
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
                /></th>
                <th>Spring ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Group</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ungroupedProducts.map(p => renderProductRow(p, true))}
            </tbody>
          </table>
        </div>
      )}

      {adminMessage && (
        <p className={adminMessage.includes("successfully") ? "success" : "error"}>{adminMessage}</p>
      )}

      <div className="user-management-container">
        <h2>Manage Users</h2>
        <div className="user-form">
          <input
            type="text"
            placeholder="User ID"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <button onClick={addUser} disabled={!newUserId || !newUserName}>
            Add User
          </button>
          {userMessage && (
            <p className={userMessage.includes("successfully") ? "success" : "error"}>{userMessage}</p>
          )}
        </div>
        <h3>Users</h3>
        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userid}>
                  <td>{user.userid}</td>
                  <td>{user.name}</td>
                  <td>
                    <button className="button-delete" onClick={() => deleteUser(user.userid)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="update-admin-container">
        <h2>Update Admin Account</h2>
        <form onSubmit={handleAdminUpdate} className="update-admin-form">
          <div>
            <label>Current Password:</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>New Username:</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>
          <div>
            <label>New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label>Confirm New Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit">Update Admin</button>
          {adminMessage && (
            <p className={adminMessage.includes("successfully") ? "success" : "error"}>{adminMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}