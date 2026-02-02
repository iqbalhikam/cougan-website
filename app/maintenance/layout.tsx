import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Under Maintenance - Cougan Fams',
  description: 'We are currently performing scheduled maintenance. We will be back soon!',
};

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
