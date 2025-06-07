# **App Name**: SNBD Client Hub

## Core Features:

- User Registration: User registration form connected to the WHMCS API via AddClient.
- Secure Login: Secure login system connected to WHMCS API using ValidateLogin and JWT for session management.
- Dashboard Overview: Dashboard view summarizing active services, upcoming renewals, and unpaid invoices with clear notifications.
- Service Management: Service management module that displays active, suspended, and terminated services using GetClientsProducts. Offers renewal, upgrade, and cancellation options.
- Domain Management: Domain management enabling users to view domain status, expiry, and DNS settings, with options to renew and update nameservers.
- Billing Center: Billing center that lists invoices, allows PDF downloads, and provides payment redirects using GetInvoices.
- Support System: Integrated support ticket system allowing users to view, open, and reply to tickets, using GetTickets and OpenTicket functions.

## Style Guidelines:

- Primary color: SNBD HOST red (#FF4136) for a branded, energetic feel.
- Background color: Dark gray (#222222) to complement the red and create a modern, sleek look.
- Accent color: Light gray (#DDDDDD) to provide contrast for text and interactive elements against the dark background.
- Body and headline font: 'Inter', a sans-serif for a modern, neutral, and readable experience.
- Use a set of minimalist icons to represent services, domains, billing, and support.
- Responsive layout adapting to different screen sizes, built with Tailwind CSS.
- Subtle transition effects and animations for a smooth and engaging user experience.