import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
    IconUser, 
    IconMail, 
    IconShieldCheck, 
    IconLoader2, 
    IconCamera, 
    IconAt, 
    IconLock, 
    IconShieldLock,
    IconFingerprint,
    IconId,
    IconCheck,
    IconUserCircle
} from '@tabler/icons-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="space-y-1 mb-6">
        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
);

const CardContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>
        {children}
    </div>
);

export default function ProfileSetting() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setName(data.name);
                setEmail(data.email);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            toast.error('Failed to fetch user data');
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', name);
            if (fileInputRef.current?.files?.[0]) {
                formData.append('avatar', fileInputRef.current.files[0]);
            }

            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                toast.success(data.message);
                localStorage.setItem('user', JSON.stringify(data.user));
                setFileName(null);
                setPreviewUrl(null);
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(data.message || 'Failed to update password');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                toast.success(data.message);
            } else {
                toast.error(data.message || 'Failed to update email');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setFileName(null);
            setPreviewUrl(null);
        }
    };

    if (!user)
        return (
            <div className='flex justify-start'>
                <div className="max-w-5xl space-y-4 pb-12 w-full animate-pulse">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-72" />
                            </div>
                        </div>
                        <Separator />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                        <div className="md:col-span-8 space-y-8">
                            <Skeleton className="h-[500px] w-full rounded-xl" />
                        </div>
                        <div className="md:col-span-4 space-y-8">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                            <Skeleton className="h-[350px] w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );


    return (
        <div className='flex justify-start' >
        <div className="max-w-5xl space-y-4 pb-12">
            {/* ── Page Header ── */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0 border border-primary/20 shadow-sm">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-primary">
                        <IconUserCircle size={24} />
                    </div>
                </div>
                <div className="flex flex-col truncate">
                    <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate">
                        Profile Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">Manage your account settings and preferences.</p>
                </div>
            </div>
            <Separator />


            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                {/* ── Profile Section ── */}
                <div className="md:col-span-8 space-y-8">
                    <CardContainer>
                        <div className="p-6 md:p-8 space-y-8">
                            <SectionHeader 
                                title="Profile Information" 
                                description="Update your photo and personal details."
                            />

                            <form onSubmit={handleProfileUpdate} className="space-y-8">
                                {/* Avatar Upload */}
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border shadow-sm transition-opacity group-hover:opacity-80">
                                            <AvatarImage src={previewUrl || user.avatar_url} className="object-cover" />
                                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                                                {user?.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 p-2 bg-background border rounded-full shadow-sm hover:bg-accent transition-colors"
                                            title="Change Photo"
                                        >
                                            <IconCamera size={14} className="text-muted-foreground" />
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-2 text-center sm:text-left">
                                        <h4 className="text-sm font-semibold">Profile Photo</h4>
                                        <p className="text-xs text-muted-foreground mb-3">JPG, GIF or PNG. Max size of 2MB.</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-3">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-8 text-xs font-medium"
                                            >
                                                Upload New
                                            </Button>
                                            {fileName && (
                                                <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">
                                                    {fileName}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            id="avatar"
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="max-w-md"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-start pt-4">
                                    <Button type="submit" disabled={loading} className="gap-2">
                                        {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />}
                                        Update Profile
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </CardContainer>

                    {/* Email Settings */}
                    <CardContainer>
                        <div className="p-6 md:p-8 space-y-6">
                            <SectionHeader 
                                title="Contact Information" 
                                description="Manage your primary email address for notifications."
                            />

                            <form onSubmit={handleEmailUpdate} className="space-y-4 max-w-md">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                    <div className="relative">
                                        <IconAt size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-9"
                                        />
                                    </div>
                                    
                                    <AnimatePresence>
                                        {!user.email_verified_at && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-md space-y-1"
                                            >
                                                <div className="flex items-center gap-2 text-warning">
                                                    <IconShieldLock size={14} />
                                                    <span className="text-[10px] font-bold uppercase">Unverified Email</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                    Your email is not verified. Please check your inbox for the link.
                                                </p>
                                                <button
                                                    type="button"
                                                    disabled={isResending}
                                                    onClick={() => {
                                                        setIsResending(true);
                                                        const token = localStorage.getItem('token');
                                                        const promise = fetch('/api/email/verification-notification', {
                                                            method: 'POST',
                                                            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                                                        }).then(async (res) => {
                                                            const data = await res.json();
                                                            if (!res.ok) throw new Error(data.message || 'Failed to send verification email');
                                                            return data;
                                                        }).finally(() => setIsResending(false));

                                                        toast.promise(promise, {
                                                            loading: 'Sending verification link...',
                                                            success: (data) => data.message || 'Verification link sent!',
                                                            error: (err) => err.message || 'An error occurred',
                                                        });
                                                    }}
                                                    className="text-[10px] font-bold text-primary hover:underline transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                >
                                                    {isResending && <IconLoader2 size={12} className="animate-spin" />}
                                                    Resend Verification Link
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <Button type="submit" disabled={loading} variant="secondary" size="sm">
                                    Update Email
                                </Button>
                            </form>
                        </div>
                    </CardContainer>
                </div>

                {/* ── Sidebar: Security ── */}
                <div className="md:col-span-4 space-y-8">
                    <CardContainer>
                        <div className="p-6 space-y-6">
                            <SectionHeader 
                                title="Security" 
                                description="Manage your password."
                            />

                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Password</Label>
                                    <Input
                                        id="current_password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new_password text-xs font-medium uppercase tracking-wider text-muted-foreground">New Password</Label>
                                    <Input
                                        id="new_password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirm_password text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                                    <Input
                                        id="confirm_password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <Button type="submit" disabled={loading} variant="outline" className="w-full mt-4 h-9 text-xs font-medium">
                                    Save New Password
                                </Button>
                            </form>
                        </div>
                    </CardContainer>

                    <div className="p-6 bg-card border rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <IconShieldCheck size={16} />
                            <span className="text-[11px] font-semibold uppercase tracking-widest">Account Security</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Ensure your password is at least 8 characters long and includes numbers and special characters.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
