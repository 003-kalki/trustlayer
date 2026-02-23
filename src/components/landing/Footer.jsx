import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-card/50 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">
              Trust<span className="text-primary">Chain</span>
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2026 TrustChain. Decentralized trust for the open web.
          </p>

          <div className="flex gap-6">
            {["GitHub", "Discord", "Twitter"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;