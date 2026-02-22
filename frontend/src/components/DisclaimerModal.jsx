import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const DisclaimerModal = ({ onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        data-testid="disclaimer-modal"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl mx-4 bg-[#0A0A0A] border border-[rgba(0,255,65,0.3)] p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 flex items-center justify-center bg-[#00FF41]/10 border border-[#00FF41]/30">
              <Shield className="w-7 h-7 text-[#00FF41]" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold text-[#00FF41] tracking-wider glow-text">
                AUTHORIZATION REQUIRED
              </h1>
              <p className="text-sm text-[#666666] font-mono tracking-wider">
                NEXUS PENTEST LLM v1.0
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-[#FFB000]/10 border border-[#FFB000]/30 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FFB000] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-mono text-sm font-semibold text-[#FFB000] mb-2">
                  LEGAL DISCLAIMER
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  This tool is designed for <span className="text-[#00FF41] font-semibold">authorized security testing only</span>. 
                  Unauthorized access to computer systems is illegal and punishable by law.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Text */}
          <div className="space-y-4 mb-8">
            <p className="text-sm text-white/70 leading-relaxed">
              By proceeding, you confirm and acknowledge that:
            </p>
            <ul className="space-y-3">
              {[
                "All targets are within your authorized scope of testing",
                "You have written permission or legal authority to test all systems",
                "You accept full responsibility for any actions performed",
                "You will not use this tool for malicious or unauthorized purposes"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#00FF41] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-black/50 border border-white/10">
            <Checkbox
              id="agreement"
              checked={agreed}
              onCheckedChange={setAgreed}
              className="border-[#00FF41]/50 data-[state=checked]:bg-[#00FF41] data-[state=checked]:border-[#00FF41]"
              data-testid="disclaimer-checkbox"
            />
            <label
              htmlFor="agreement"
              className="text-sm text-white/90 cursor-pointer font-mono"
            >
              I confirm that <span className="text-[#00FF41]">ALL TARGETS AND SCOPE HAVE CLEARANCE</span> to proceed with penetration testing
            </label>
          </div>

          {/* Proceed Button */}
          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="w-full h-12 bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] font-mono text-sm tracking-wider hover:bg-[#00FF41]/20 hover:border-[#00FF41]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            data-testid="disclaimer-proceed-btn"
          >
            {agreed ? (
              <>
                PROCEED TO NEXUS
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              "CONFIRM AUTHORIZATION TO PROCEED"
            )}
          </Button>

          {/* Footer */}
          <p className="mt-6 text-center text-[10px] text-[#666666] font-mono tracking-wider">
            SESSION WILL BE LOGGED • USE RESPONSIBLY • ETHICAL HACKING ONLY
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
