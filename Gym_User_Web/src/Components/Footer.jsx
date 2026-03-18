import React from "react";
import { Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";
import PageContainer from "./PageContainer";

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-red-500/30">
      <PageContainer>
      <div
        className="
          py-10
          grid grid-cols-1
          md:grid-cols-[1.6fr_0.7fr_1fr_1.7fr]
          gap-10
        "
      >
        {/* 1️⃣ BRAND / ABOUT */}
        <div>
          <img
            src="/images/logo-dark.png"
            alt="Power Gym Logo"
            className="h-10 w-auto mb-3"
          />

          <p className="text-white/70 text-[15px] leading-relaxed text-justify">
           Power Gym is a premium fitness center equipped with modern machines, expert trainers, and a motivating environment to help you achieve your fitness goals faster and safer. We focus on strength, discipline, and long-term transformation.
          </p>
        </div>

        {/* 2️⃣ QUICK LINKS */}
        <div>
          <h3 className="text-[16px] font-bold text-red-500 mb-5 tracking-wide">
            QUICK LINKS
          </h3>
          <ul className="list-disc list-inside space-y-[6px] text-[14px] text-white/75 marker:text-red-500">
            <li><Link to="/" className="hover:text-red-500">Home</Link></li>
            <li><Link to="/facilities" className="hover:text-red-500">Facilities</Link></li>
            <li><Link to="/trainers" className="hover:text-red-500">Trainers</Link></li>
            <li><Link to="/services" className="hover:text-red-500">Services</Link></li>
            <li><Link to="/pricing" className="hover:text-red-500">Pricing</Link></li>
            <li><Link to="/contact" className="hover:text-red-500">Contact Us</Link></li>
          </ul>
        </div>

        {/* 3️⃣ CONTACT */}
        <div>
          <h3 className="text-[16px] font-bold text-red-500 mb-5 tracking-wide">
            CONTACT
          </h3>
          <ul className="space-y-[10px] text-[14px] text-white/75">
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-red-500 mt-1" />
              No. 21/3, <br/>Anna Nager, Chennai, Tamil Nadu
            </li>
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-red-500" />
              +91 98765 43210
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-red-500" />
              info@powergym.com
            </li>
            <li className="flex items-center gap-2">
              <FaClock className="text-red-500" />
              Mon – Sun : 5AM – 10PM
            </li>
          </ul>
        </div>

        {/* 4️⃣ MAP */}
        <div>
          <h3 className="text-[16px] font-bold text-red-500 mb-2 tracking-wide">
            LOCATION
          </h3>
          <div className="w-full h-45 rounded-lg overflow-hidden border border-red-500/20">
            <iframe
              title="Power Gym Location"
              src="https://www.google.com/maps?q=Chennai,Tamil%20Nadu&output=embed"
              className="w-full h-full grayscale hover:grayscale-0 transition"
              loading="lazy"
            />
          </div>
        </div>
      </div>
      </PageContainer>

      {/* BOTTOM BAR */}
      <div className="border-t border-red-500/20 py-3 text-center text-[13px] text-white/60">
        © {new Date().getFullYear()}{" "}
        <span className="text-red-500 font-semibold">Power Gym</span>. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;