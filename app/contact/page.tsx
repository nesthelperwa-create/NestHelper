import { Mail, Phone, MapPin } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { siteConfig } from "@/lib/siteConfig";

export default function ContactPage(){return <><PageHero eyebrow="Contact" title="Questions before you request?" text="Send a note and we’ll help you figure out the right Parent Reset service." cta={false}/><section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"><div className="grid gap-4 self-start rounded-[2rem] bg-white p-6 shadow-soft"><Info icon={<Mail/>} label="Email" value={siteConfig.email}/><Info icon={<Phone/>} label="Phone" value={siteConfig.phone}/><Info icon={<MapPin/>} label="Serving" value={siteConfig.serviceArea}/></div><ContactForm/></section></>}
function Info({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="flex gap-4 rounded-2xl bg-nest-cream p-4"><div className="text-nest-teal">{icon}</div><div><div className="text-sm font-black uppercase tracking-[0.18em] text-nest-gold">{label}</div><div className="font-bold text-nest-ink/78">{value}</div></div></div>}
