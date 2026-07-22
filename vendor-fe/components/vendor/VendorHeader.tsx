"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { vendorStyles as styles } from "./vendorStyles";

export function VendorHeader({ name, onSignOut, onMenuOpen }: { name: string; onSignOut: () => void; onMenuOpen: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <button type="button" onClick={onMenuOpen} className={styles.mobileMenu} aria-label="Open navigation"><Menu size={21} aria-hidden="true" /></button>
          <Image src="/images/logo/logo.png" alt="Pharma2U" width={118} height={38} className={styles.logo} priority />
          <div className={styles.brandCopy}><p className={styles.kicker}>Vendor portal</p><strong>Pharmacy workspace</strong></div>
        </div>
        <div className={styles.account}>
          <span className={styles.accountName}>{name}</span>
          <button type="button" onClick={onSignOut} className={styles.secondaryButton}>Sign out</button>
        </div>
      </div>
    </header>
  );
}