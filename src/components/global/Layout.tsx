import { PropsWithChildren } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { Toaster } from "react-hot-toast";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "var(--safe-left)",
        paddingRight: "var(--safe-right)",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <Navbar />
      {children}
      <Footer />
      <BottomNav />
      <Toaster />
    </div>
  );
};

export default Layout;
