import React, { useEffect, useState } from "react";
import { userProfileApi, bookingsApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  MapPin,
  User as UserIcon,
  LogOut,
  Package,
} from "lucide-react";
import Logo from "../components/Logo";

import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setLoading(true);
          const [profileData, bookingsRes] = await Promise.all([
            userProfileApi.getCurrentUserProfile(),
            bookingsApi.getUserBookings(),
          ]);
          setProfile(profileData?.data?.user ?? profileData);
          setBookings(bookingsRes.data || []);
        } catch (err: any) {
          setError(err.message || "Failed to load profile data");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm">
          <p className="text-xl font-bold mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Logo className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Settings
              </h1>
              <p className="text-gray-500">
                Manage your profile and view bookings
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 border-red-100 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex w-auto">
            <TabsTrigger
              value="info"
              className="px-6 rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="px-6 rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Booking History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <CardTitle>Profile Details</CardTitle>
                <CardDescription className="text-pink-100">
                  Your basic information and account status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Username
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {profile?.username}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Email Address
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {profile?.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Mobile Number
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {profile?.mobile_no}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Full Name
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {profile?.first_name || profile?.last_name
                          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                          : "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Account Role
                      </label>
                      <Badge className="capitalize text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                        {profile?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card className="border-dashed border-2 py-12 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No bookings found</p>
                  <Button
                    variant="link"
                    className="text-pink-600 mt-2"
                    onClick={() => (window.location.href = "/")}
                  >
                    Start exploring rooms
                  </Button>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-48 h-32 bg-gray-200">
                        <img
                          src={booking.room?.images?.[0] || "/placeholder.svg"}
                          alt={booking.room?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {booking.room?.name || "Unknown Room"}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {booking.room?.location}
                            </div>
                          </div>
                          <Badge
                            className={`${getStatusColor(booking.status)} px-3 py-1 border`}
                          >
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                            {new Date(booking.checkIn).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                            {new Date(booking.checkOut).toLocaleDateString()}
                          </div>
                          <div className="font-bold text-gray-900">
                            Total: ${booking.totalPrice}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
