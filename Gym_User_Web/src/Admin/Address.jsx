import React, { useState } from "react";
import api from "../api";

export default function AddressForm() {
    const [form, setForm] = useState({
        user_id: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "India"
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

   const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    const res = await api.post("/address/add", form);
    const data = res.data;

    console.log(data);

    if (data.success) {
      alert("Address saved successfully");

      setForm({
        user_id: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "India"
      });
    }

  } catch (error) {
    console.error("Error:", error);
  }
};
    return (
        <div style={{ maxWidth: "500px", margin: "40px auto" }}>
            <h2>Shipping Address</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="user_id"
                    placeholder="User ID"
                    value={form.user_id}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={handleChange}
                    required
                />

                <textarea
                    name="address"
                    placeholder="Address"
                    value={form.address}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={form.state}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    value={form.zip}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={form.country}
                    onChange={handleChange}
                />

                <button type="submit">Save Address</button>

            </form>
        </div>
    );
}