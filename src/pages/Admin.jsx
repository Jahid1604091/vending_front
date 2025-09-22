import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "../api";
import "./Admin.css";
import "./Users.css";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: 0, quantity: 0, file: null });
  const [users, setUsers] = useState([]);
  const [newUserId, setNewUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const backendUrl = "http://localhost:5001"; // Backend base URL

  const fetchProducts = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setAdminMessage("Unauthorized: Please log in again");
        return;
      }
      const res = await api.get("/api/products");
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
    fetchUsers();
  }, []);

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, price: p.price, quantity: p.quantity, file: null });
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
      setForm({ name: "", price: 0, quantity: 0, file: null });
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

  return (
    <div className="admin-container">
      {/* <h1>Admin Panel</h1> */}
      <h2>Manage Products</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
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
                    src={p.image ? `${backendUrl}${p.image}?t=${Date.now()}` : "/images/fallback.jpg"}
                    alt={p.name}
                    className="admin-image"
                    onError={(e) => {
                      console.error(`Image failed to load: ${p.image}`);
                      e.target.src = "/images/fallback.jpg";
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
          ))}
        </tbody>
      </table>
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