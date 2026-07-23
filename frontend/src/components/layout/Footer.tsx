import React from 'react';
import { Link } from 'wouter';
import { FiTwitter, FiFacebook, FiInstagram, FiYoutube, FiLinkedin } from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal, FaCcStripe, FaCcApplePay } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 group w-fit">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                E
              </div>
              <span className="font-bold text-xl tracking-tight">STORE</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              The ultimate destination for premium products. Experience the future of online shopping today.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><FiTwitter className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><FiFacebook className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><FiInstagram className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><FiYoutube className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><FiLinkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Press</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Investor Relations</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop?category=Electronics" className="text-muted-foreground hover:text-foreground transition-colors">Electronics</Link></li>
              <li><Link href="/shop?category=Fashion" className="text-muted-foreground hover:text-foreground transition-colors">Fashion</Link></li>
              <li><Link href="/shop?category=Audio" className="text-muted-foreground hover:text-foreground transition-colors">Audio</Link></li>
              <li><Link href="/shop?category=Gaming" className="text-muted-foreground hover:text-foreground transition-colors">Gaming</Link></li>
              <li><Link href="/shop?category=Sports" className="text-muted-foreground hover:text-foreground transition-colors">Sports</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Track Order</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <h4 className="font-semibold text-sm self-center">Subscribe to our Newsletter</h4>
            <div className="flex w-full sm:w-auto max-w-sm">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-secondary/50 border border-border rounded-l-md px-4 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-r-md hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-secondary px-4 py-2 rounded-md cursor-pointer hover:bg-secondary/80 transition-colors flex items-center space-x-2">
              <div className="text-xs font-semibold">App Store</div>
            </div>
            <div className="bg-secondary px-4 py-2 rounded-md cursor-pointer hover:bg-secondary/80 transition-colors flex items-center space-x-2">
              <div className="text-xs font-semibold">Google Play</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ESTORE. All rights reserved.</p>
          <div className="flex space-x-3 text-xl">
            <FaCcVisa className="hover:text-foreground transition-colors" />
            <FaCcMastercard className="hover:text-foreground transition-colors" />
            <FaCcAmex className="hover:text-foreground transition-colors" />
            <FaCcPaypal className="hover:text-foreground transition-colors" />
            <FaCcStripe className="hover:text-foreground transition-colors" />
            <FaCcApplePay className="hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
