import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import ServiceCard from "./ServicesCard";
import cache from "../cache";

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      if (cache.services) {
        setServices(cache.services);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.get("/services");
        const data = response.data || [];
        setServices(data);
        cache.services = data;
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Personalized fitness services designed for every goal and body type"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="bg-[#05060c] py-20">
        <PageContainer>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px] gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Services</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {services.map((item, index) => (
                <ServiceCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </PageContainer>
      </section >
    </>
  );
}
