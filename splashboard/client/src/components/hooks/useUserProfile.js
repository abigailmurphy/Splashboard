// src/hooks/useUserProfile.js
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../Context";

export default function useUserProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const {setIsMember} = useAuth();
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const { data } = await axios.get("http://localhost:4000/user", {
        withCredentials: true,
      });
      setUser(data.user);
      setForm({
        first: data.user.name.first,
        last: data.user.name.last,
        email: data.user.email,
        password: "",
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      navigate("/");
      toast.error("Unable to load profile", { theme: "dark" });
    }
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `http://localhost:4000/user/${user._id}`,
        form,
        { withCredentials: true }
      );
      setUser(res.data.updatedUser);
      
      toast.success("Profile updated!", { theme: "dark" });
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Update failed", { theme: "dark" });
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAcceptMembership = async () => {
    const confirmAccept = window.confirm(
      "Are you sure? By accepting, you agree to pay the amount set."
    );
    if (!confirmAccept) return;
  
    try {
      await axios.put(
        `http://localhost:4000/user/${user._id}/accept`,
        { membershipType: user.membershipType },
        { withCredentials: true }
      );
      await fetchUser(); // Refresh user data
      setIsMember(true);
      toast.success("Membership accepted!", { theme: "dark" });
      navigate("/");
    } catch (err) {
      console.error("Failed to accept membership:", err);
      toast.error("Could not accept membership", { theme: "dark" });
    }
  };
  
  

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    form,
    setForm,
    fetchUser,
    handleSave,
    handleFormChange,
    handleAcceptMembership
  };
}
