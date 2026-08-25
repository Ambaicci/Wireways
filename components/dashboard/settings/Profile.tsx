"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Building2, User, Clock, Users, Camera, X } from "lucide-react";
import { updateProfile, uploadAvatar, removeAvatar } from "@/lib/actions";

const TIMEZONES = [
  "UTC",
  "Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg", "Africa/Cairo", "Africa/Accra",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Amsterdam", "Europe/Madrid",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Sao_Paulo",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland",
];

interface Props {
  user: { name: string; email: string; company: string };
  settings: Record<string, any>;
  patchSetting: (key: string, value: any) => void;
}

// Client-side image prep: center-crop to a square, resize to 256×256.
// Keeps avatars tiny (~30KB) so they live safely in the database.
async function processAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const inputCls = "mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]";
const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

export default function Profile({ user, settings, patchSetting }: Props) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatar, setAvatar] = useState<string>(settings.avatar_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Sync once the real settings arrive from the server
  useEffect(() => {
    setAvatar(settings.avatar_url || "");
  }, [settings.avatar_url]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await updateProfile({ name, company });
    setSavingProfile(false);
    router.refresh();
  };

  const handleAvatarSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const previous = settings.avatar_url || "";
    try {
      const dataUrl = await processAvatar(file);
      setAvatar(dataUrl); // instant preview — never keep the user waiting
      setUploadingAvatar(true);
      const res = await uploadAvatar(dataUrl);
      setUploadingAvatar(false);
      if (!res.success) setAvatar(previous);
    } catch {
      setUploadingAvatar(false);
      setAvatar(previous);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatar("");
    setUploadingAvatar(true);
    await removeAvatar();
    setUploadingAvatar(false);
  };

  const initials = (name || user.email).split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const isBusiness = settings.account_type === "business";

  return (
    <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar — real upload, instant preview, hover-to-remove */}
        <div className="relative group shrink-0">
          {avatar ? (
            <img src={avatar} alt="Workspace avatar" className="w-12 h-12 rounded-full object-cover border border-[#E8E0D4]" />
          ) : (
            <div className="w-12 h-12 rounded-full grid place-items-center text-white font-bold text-[15px]" style={{ background: "#F1622C" }}>{initials}</div>
          )}
          <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
            title={avatar ? "Change photo" : "Upload a photo"}
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#312B1E] text-white grid place-items-center hover:bg-[#F1622C] transition-colors">
            {uploadingAvatar ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
          </button>
          {avatar && !uploadingAvatar && (
            <button onClick={handleAvatarRemove} title="Remove photo"
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#A84B3D] text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarSelect(f);
              e.target.value = "";
            }} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">Workspace profile</h2>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isBusiness ? "bg-[#EAEDF5] text-[#4C5C88]" : "bg-[#E8F3EC] text-[#287A55]"}`}>
              {isBusiness ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {isBusiness ? "Business workspace" : "Personal account"}
            </span>
          </div>
          <p className="text-[12px] text-[#8D8476]">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Display name <span className="text-[#8D8476] normal-case tracking-normal">(drives the greeting)</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company name" className={inputCls} />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelCls}><Clock className="w-3 h-3 inline mr-1 -mt-0.5" />Timezone <span className="text-[#8D8476] normal-case tracking-normal">(WIC briefings land in your local morning)</span></label>
        <select value={settings.timezone} onChange={(e) => patchSetting("timezone", e.target.value)} className={inputCls}>
          {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
        </select>
      </div>

      <button onClick={handleSaveProfile} disabled={savingProfile}
        className="mt-5 flex items-center gap-2 bg-[#312B1E] text-white px-5 py-2.5 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all disabled:opacity-60">
        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save changes
      </button>

      <div className="mt-4 flex items-start justify-between gap-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4 opacity-70">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-[10px] bg-[#EAEDF5]"><Users className="w-4 h-4 text-[#4C5C88]" /></div>
          <div>
            <div className="text-[13px] font-bold text-[#312B1E]">Team members <span className="ml-2 text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F5EFE6] text-[#8D8476] px-1.5 py-0.5 rounded-full">Coming soon</span></div>
            <p className="text-[11.5px] text-[#8D8476] mt-0.5 leading-relaxed">Invite colleagues with roles and permissions. Available for business workspaces.</p>
          </div>
        </div>
      </div>
    </section>
  );
}