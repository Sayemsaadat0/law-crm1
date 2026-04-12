"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProfilePreview from "@/components/dashboard/profile/ProfilePreview";
import EditProfileForm from "@/components/dashboard/profile/EditProfileForm";
import ChangePasswordForm from "@/components/dashboard/profile/ChangePasswordForm";
import { useAuthStore } from "@/store/authStore";
import { formatDisplayDate } from "@/lib/utils";
import { toast } from "sonner";

function Profile() {
  const { user, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!user) {
          await fetchUser();
        }
      } catch (error) {
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, fetchUser]);

  const handleProfileUpdate = async () => {
    try {
      await fetchUser();
      toast.success("Profile updated successfully!");
    } catch (error) {
      // Error handled in fetchUser
    }
  };

  if (isLoading || !user) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-green/20 border-t-primary-green"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-primary-green/30"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Fiverr-style Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Profile Card (Fiverr Style) */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ProfilePreview user={user} />
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="profile" className="w-full">
              {/* Fiverr-style Tabs */}
              <div className="mb-6">
                <TabsList className="inline-flex bg-transparent border-b border-gray-200 p-0 h-auto gap-0">
                  <TabsTrigger 
                    value="profile"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent rounded-none data-[state=active]:border-primary-green data-[state=active]:bg-transparent hover:text-gray-900 transition-colors"
                  >
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="edit"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent rounded-none data-[state=active]:border-primary-green data-[state=active]:bg-transparent hover:text-gray-900 transition-colors"
                  >
                    Edit Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="password"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent rounded-none data-[state=active]:border-primary-green data-[state=active]:bg-transparent hover:text-gray-900 transition-colors"
                  >
                    Change Password
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Information</h2>
                    <p className="text-sm text-gray-500">View your complete profile details</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Full Name</span>
                      <span className="text-sm text-gray-900">{user.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Email</span>
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                    {user.mobile && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Mobile</span>
                        <span className="text-sm text-gray-900">{user.mobile}</span>
                      </div>
                    )}
                    {(user.joining_date || user.created_at) && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Member Since</span>
                        <span className="text-sm text-gray-900">
                          {user.joining_date
                            ? formatDisplayDate(user.joining_date)
                            : user.created_at
                              ? formatDisplayDate(user.created_at)
                              : "N/A"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-gray-600">Role</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Edit Profile</h2>
                    <p className="text-sm text-gray-500">Update your profile information and personal details</p>
                  </div>
                  <EditProfileForm user={user} onUpdate={handleProfileUpdate} />
                </div>
              </TabsContent>

              <TabsContent value="password" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
                    <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                  </div>
                  <ChangePasswordForm />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
