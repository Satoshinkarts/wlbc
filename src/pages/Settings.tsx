import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, KeyRound, User, Save, Send, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "", telegram_chat_id: "", is_vip: false });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [siteShutdown, setSiteShutdown] = useState(false);
  const [shutdownMessage, setShutdownMessage] = useState("");
  const [shutdownLoading, setShutdownLoading] = useState(true);
  const [savingShutdown, setSavingShutdown] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, address, telegram_chat_id, is_vip")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          telegram_chat_id: data.telegram_chat_id || "",
          is_vip: data.is_vip || false,
        });
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Fetch shutdown settings (admin only)
  useEffect(() => {
    if (!isAdmin) {
      setShutdownLoading(false);
      return;
    }
    const fetchShutdown = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("is_shutdown, shutdown_message")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();
      if (data) {
        setSiteShutdown(data.is_shutdown);
        setShutdownMessage(data.shutdown_message || "");
      }
      setShutdownLoading(false);
    };
    fetchShutdown();
  }, [isAdmin]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
          telegram_chat_id: profile.telegram_chat_id.trim() || null,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      const { data, error } = await supabase.functions.invoke("password-reset", {
        body: { action: "change_password", currentPassword, newPassword },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  const handleToggleShutdown = async (checked: boolean) => {
    setSavingShutdown(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ is_shutdown: checked, shutdown_message: shutdownMessage.trim() || "This site is currently under maintenance.", updated_at: new Date().toISOString() })
        .eq("id", "00000000-0000-0000-0000-000000000001");
      if (error) throw error;
      setSiteShutdown(checked);
      toast.success(checked ? "Site is now shut down" : "Site is back online");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingShutdown(false);
    }
  };

  if (authLoading || profileLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        {profile.is_vip && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">👑 VIP</Badge>
        )}
      </div>

      {/* Profile */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Full Name</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="bg-secondary border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="bg-secondary border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Address</Label>
              <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="bg-secondary border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm flex items-center gap-1.5">
                <Send className="h-3 w-3 text-primary" /> Telegram Chat ID
              </Label>
              <Input
                value={profile.telegram_chat_id}
                onChange={(e) => setProfile({ ...profile, telegram_chat_id: e.target.value })}
                placeholder="e.g. 123456789"
                className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">Required for Telegram password reset. Send /start to @userinfobot to get your ID.</p>
            </div>
            <Button type="submit" disabled={savingProfile} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
              {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={6} className="bg-secondary border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="bg-secondary border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="bg-secondary border-border text-foreground text-sm" />
            </div>
            <Button type="submit" disabled={changingPw} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
              {changingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
