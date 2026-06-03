import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center text-sm text-gray-600 py-4 mt-auto">
      <p>📞 010-1234-5678 | 📧 contact@example.com</p>
      <p>사업자등록번호: 123-45-67890</p>
      <p>&copy; {new Date().getFullYear()} My Company. All rights reserved.</p>
    </footer>
  );
}
