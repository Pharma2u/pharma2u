"use client";

import { Menu } from "lucide-react";
import { vendorStyles as styles } from "./vendorStyles";
import { VendorNotifications } from "./VendorNotifications";
import { CompanyLogo } from "../branding/CompanyLogo";

export function VendorHeader({ name, token, onSignOut, onMenuOpen }: { name: string; token: string; onSignOut: () => void; onMenuOpen: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <button type="button" onClick={onMenuOpen} className={styles.mobileMenu} aria-label="Open navigation"><Menu size={21} aria-hidden="true" /></button>
          <CompanyLogo width={230} height={86} className={styles.logo} priority />
          <div className={styles.brandCopy}><p className={styles.kicker}>Vendor portal</p><strong>Pharmacy workspace</strong></div>
        </div>
        <div className={styles.account}>
          <VendorNotifications token={token} /><span className={styles.accountName}>{name}</span>
          <button type="button" onClick={onSignOut} className={styles.secondaryButton}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
