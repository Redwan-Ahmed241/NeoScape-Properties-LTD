"use client";

import React, { useState } from "react";
import { bookingsApi } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Calendar, Users, Phone, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Room } from "../lib/types";
import { useAuth } from "../hooks/useAuth";

interface BookingFormProps {
  room: Room;
}

const BookingForm: React.FC<BookingFormProps> = ({ room }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotalPrice = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return nights > 0 ? nights * room.price : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      const bookingPayload = {
        roomId: String(room.id),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: Number(formData.guests),
        guestInfo: {
          name: formData.guestName,
          email: formData.guestEmail,
          phone: formData.guestPhone,
        },
      };

      await bookingsApi.createBooking(bookingPayload);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-2">
            Booking Requested!
          </h3>
          <p className="text-green-700 mb-4">
            Your booking request has been submitted successfully.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Book this room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="checkIn"
                  name="checkIn"
                  type="date"
                  required
                  value={formData.checkIn}
                  onChange={handleChange}
                  className="pl-10"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="checkOut"
                  name="checkOut"
                  type="date"
                  required
                  value={formData.checkOut}
                  onChange={handleChange}
                  className="pl-10"
                  min={
                    formData.checkIn || new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="guests"
                name="guests"
                type="number"
                required
                min={1}
                max={room.maxGuests}
                value={formData.guests}
                onChange={handleChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="guestName"
                name="guestName"
                type="text"
                required
                placeholder="John Doe"
                value={formData.guestName}
                onChange={handleChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="guestEmail"
                  name="guestEmail"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.guestEmail}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="guestPhone"
                  name="guestPhone"
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.guestPhone}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {totalPrice > 0 && (
            <div className="p-4 bg-pink-50 rounded-lg flex justify-between items-center">
              <span className="font-medium text-pink-900">Total Price</span>
              <span className="text-xl font-bold text-pink-600">
                ${totalPrice}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold h-12"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Simple Check icon for success state
const Check = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default BookingForm;
