import os
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def build_pdf():
    pdf_path = r"c:\Users\mizaa\OneDrive\Desktop\Work\Anti Gravity IDE\QuickSplit\QuickSplit_Hackathon_Pitch_Deck.pdf"
    
    # 16:9 Landscape widescreen: 13.333 inches x 7.5 inches
    PAGE_WIDTH = 13.333 * inch
    PAGE_HEIGHT = 7.5 * inch
    
    c = canvas.Canvas(pdf_path, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    
    # Palette
    C_BG = HexColor("#0A0F1D")
    C_CARD = HexColor("#141E33")
    C_BORDER = HexColor("#233252")
    C_PURPLE = HexColor("#6366F1")
    C_GREEN = HexColor("#10B981")
    C_ORANGE = HexColor("#FF9933")
    C_RED = HexColor("#F87171")
    C_WHITE = HexColor("#F8FAFC")
    C_MUTED = HexColor("#94A3B8")
    C_CARD_HEADER = HexColor("#1E2945")

    def draw_background():
        c.setFillColor(C_BG)
        c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)
        
        # Subtle glow accents
        c.setFillColor(HexColor("#12192E"))
        c.circle(PAGE_WIDTH - 1.5 * inch, PAGE_HEIGHT - 1.5 * inch, 2.5 * inch, fill=True, stroke=False)
        c.circle(1.5 * inch, 1.5 * inch, 2.0 * inch, fill=True, stroke=False)

    def draw_header(title, category="HACKATHON PITCH DECK"):
        # Category pill
        c.setFillColor(C_CARD)
        c.setStrokeColor(C_PURPLE)
        c.setLineWidth(1)
        c.roundRect(0.8 * inch, PAGE_HEIGHT - 0.9 * inch, 2.8 * inch, 0.35 * inch, 6, fill=True, stroke=True)
        
        c.setFillColor(C_PURPLE)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(0.95 * inch, PAGE_HEIGHT - 0.68 * inch, f"⚡ {category}")
        
        # Main Title
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(0.8 * inch, PAGE_HEIGHT - 1.45 * inch, title)

    def draw_footer(slide_num, total_slides=8):
        c.setStrokeColor(HexColor("#1E2945"))
        c.setLineWidth(1)
        c.line(0.8 * inch, 0.65 * inch, PAGE_WIDTH - 0.8 * inch, 0.65 * inch)
        
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 10)
        c.drawString(0.8 * inch, 0.4 * inch, "QuickSplit IN — Zero-Knowledge Financial Settlement & Precision Allocation")
        
        c.drawRightString(PAGE_WIDTH - 0.8 * inch, 0.4 * inch, f"Slide {slide_num} of {total_slides}")

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    draw_background()
    
    # Outer Hero Container
    c.setFillColor(C_CARD)
    c.setStrokeColor(C_PURPLE)
    c.setLineWidth(1.5)
    c.roundRect(1.2 * inch, 0.9 * inch, PAGE_WIDTH - 2.4 * inch, PAGE_HEIGHT - 1.8 * inch, 16, fill=True, stroke=True)
    
    # Top Live Badge
    c.setFillColor(HexColor("#1A2742"))
    c.setStrokeColor(C_GREEN)
    c.setLineWidth(1)
    c.roundRect(PAGE_WIDTH / 2 - 2.0 * inch, PAGE_HEIGHT - 2.2 * inch, 4.0 * inch, 0.4 * inch, 8, fill=True, stroke=True)
    c.setFillColor(C_GREEN)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 1.95 * inch, "⚡ LIVE ON VERCEL • HACKATHON SHOWCASE")

    # Main Big Title
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 46)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 3.1 * inch, "QuickSplit IN")

    # Subtitle
    c.setFillColor(C_MUTED)
    c.setFont("Helvetica", 17)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 3.7 * inch, "Zero-Knowledge Financial Settlement & Precision Cost Allocation")
    c.setFont("Helvetica", 14)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 4.05 * inch, "Built for College Project Teams, Roommates & Hackathon Participants")

    # 4 Feature Pills
    features = [
        ("🛡️ Zero-Knowledge E2EE", C_GREEN),
        ("💸 Multi-Payer Bill Splits", C_PURPLE),
        ("⚡ Greedy Debt Minimization", C_ORANGE),
        ("📱 1-Click UPI & Dynamic QR", C_GREEN)
    ]
    pill_w = 2.5 * inch
    pill_h = 0.45 * inch
    start_x = (PAGE_WIDTH - (len(features) * pill_w + (len(features) - 1) * 0.2 * inch)) / 2
    for idx, (label, col) in enumerate(features):
        px = start_x + idx * (pill_w + 0.2 * inch)
        py = 2.0 * inch
        c.setFillColor(HexColor("#1A253D"))
        c.setStrokeColor(col)
        c.setLineWidth(1)
        c.roundRect(px, py, pill_w, pill_h, 8, fill=True, stroke=True)
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawCentredString(px + pill_w / 2, py + 0.14 * inch, label)

    # Live Link
    c.setFillColor(C_PURPLE)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_WIDTH / 2, 1.35 * inch, "🔗 Live Web App: https://quickk-split.vercel.app/")

    c.showPage()

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    draw_background()
    draw_header("The Problem: Why Existing Split Apps Break in India", "PROBLEM STATEMENT")

    cards_p = [
        ("1. Multi-Payer Invoicing Chaos",
         "College hardware purchases (Raspberry Pi, sensors, PCB printing, servers) frequently involve multiple teammates paying unequal parts on a single invoice. Existing apps strictly force only 1 payer per bill.",
         "❌ Inaccurate calculations & manual spreadsheet friction"),
        ("2. Circular Debt Cascades",
         "5 teammates end up sending 10 back-and-forth bank transfers instead of a simplified minimal cash flow, incurring confusion and extra UPI friction.",
         "❌ Unnecessary bank transfers & debt confusion"),
        ("3. Cloud Database Privacy Invasions",
         "Standard split tools store phone numbers, real names, bank UPI VPAs, and private spending logs in plain text on central cloud databases.",
         "❌ Leaks, scraping, and zero database privacy"),
        ("4. Payment Friction & Locked QR Codes",
         "Copying UPI IDs manually causes typos, and pre-locked QR amounts frequently fail or get rejected by Indian banking app APIs.",
         "❌ Broken payment deep links & payment delays")
    ]

    card_w = 5.7 * inch
    card_h = 2.3 * inch
    for idx, (ctitle, cdesc, ctag) in enumerate(cards_p):
        col = idx % 2
        row = idx // 2
        cx = 0.8 * inch + col * (card_w + 0.3 * inch)
        cy = PAGE_HEIGHT - 1.8 * inch - (row + 1) * card_h - row * 0.25 * inch

        c.setFillColor(C_CARD)
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(1)
        c.roundRect(cx, cy, card_w, card_h, 10, fill=True, stroke=True)

        c.setFillColor(C_RED)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(cx + 0.3 * inch, cy + card_h - 0.45 * inch, ctitle)

        c.setFillColor(C_WHITE)
        c.setFont("Helvetica", 11)
        # Word wrap text
        words = cdesc.split()
        lines = []
        cur_line = ""
        for w in words:
            if len(cur_line + " " + w) > 65:
                lines.append(cur_line)
                cur_line = w
            else:
                cur_line += " " + w if cur_line else w
        if cur_line: lines.append(cur_line)

        ty = cy + card_h - 0.75 * inch
        for line in lines:
            c.drawString(cx + 0.3 * inch, ty, line)
            ty -= 0.22 * inch

        c.setFillColor(C_ORANGE)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(cx + 0.3 * inch, cy + 0.3 * inch, ctag)

    draw_footer(2)
    c.showPage()

    # =========================================================================
    # SLIDE 3: THE SOLUTION
    # =========================================================================
    draw_background()
    draw_header("The Solution: QuickSplit Architecture & Pillars", "VALUE PROPOSITION")

    cards_s = [
        ("⚡ Greedy Debt Simplifier",
         "Min-Cash-Flow algorithm pairs net debtors with net creditors in optimal O(V) transfers. Reduces 10 circular debts to just 2 direct transactions.",
         "Optimal O(V) Cash Flow", C_PURPLE),
        ("👥 Multi-Contributor Bills",
         "Supports bills where multiple friends contributed unevenly (e.g. Me paid ₹500, Friend 1 paid ₹300, Friend 2 paid ₹400 on a single invoice).",
         "Exact Split Accounting", C_GREEN),
        ("🛡️ Zero-Knowledge E2EE",
         "All member names, amounts, and UPI IDs are encrypted client-side using a salted AES cipher. The database owner sees ZERO plain-text data.",
         "100% Private Cloud DB", C_ORANGE),
        ("📱 1-Click UPI & Dynamic QR",
         "Direct native deep links to Google Pay, PhonePe, Paytm, BHIM, CRED, plus dynamic client-side QR codes for instant mobile camera scanning.",
         "Instant Indian UPI Settlement", C_PURPLE)
    ]

    scard_w = 2.78 * inch
    scard_h = 4.8 * inch
    for idx, (stitle, sdesc, sbadge, scol) in enumerate(cards_s):
        cx = 0.8 * inch + idx * (scard_w + 0.2 * inch)
        cy = PAGE_HEIGHT - 1.8 * inch - scard_h

        c.setFillColor(C_CARD)
        c.setStrokeColor(scol)
        c.setLineWidth(1.5)
        c.roundRect(cx, cy, scard_w, scard_h, 12, fill=True, stroke=True)

        c.setFillColor(scol)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(cx + 0.25 * inch, cy + scard_h - 0.55 * inch, stitle)

        c.setFillColor(C_WHITE)
        c.setFont("Helvetica", 11)
        words = sdesc.split()
        lines = []
        cur_line = ""
        for w in words:
            if len(cur_line + " " + w) > 28:
                lines.append(cur_line)
                cur_line = w
            else:
                cur_line += " " + w if cur_line else w
        if cur_line: lines.append(cur_line)

        ty = cy + scard_h - 1.0 * inch
        for line in lines:
            c.drawString(cx + 0.25 * inch, ty, line)
            ty -= 0.24 * inch

        # Badge at bottom
        c.setFillColor(HexColor("#18233C"))
        c.setStrokeColor(scol)
        c.roundRect(cx + 0.25 * inch, cy + 0.4 * inch, scard_w - 0.5 * inch, 0.45 * inch, 6, fill=True, stroke=True)
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(cx + scard_w / 2, cy + 0.58 * inch, sbadge)

    draw_footer(3)
    c.showPage()

    # =========================================================================
    # SLIDE 4: SECURITY & ARCHITECTURE DEEP DIVE
    # =========================================================================
    draw_background()
    draw_header("Deep Dive: Zero-Knowledge Security & Real-Time Sync", "CRYPTOGRAPHY & ALGORITHMS")

    dw_card = 5.7 * inch
    dh_card = 4.8 * inch

    # Left Card: Zero-Knowledge
    cx1 = 0.8 * inch
    cy = PAGE_HEIGHT - 1.8 * inch - dh_card
    c.setFillColor(C_CARD)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(1)
    c.roundRect(cx1, cy, dw_card, dh_card, 12, fill=True, stroke=True)

    c.setFillColor(C_GREEN)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(cx1 + 0.3 * inch, cy + dh_card - 0.5 * inch, "🔒 Zero-Knowledge Cryptographic E2EE")

    zk_points = [
        ("Client-Side Key Derivation:", "Every group generates a private 12-character cryptographic key (e.g. QS-7K9A-2X4M)."),
        ("Salted AES-Keyed Cipher:", "Every cloud sync bundles names, bills, amounts, and UPI VPAs with an 8-character random salt and 16-bit CRC checksum."),
        ("Zero Cloud Visibility:", "Firestore receives ONLY { encData: 'ENC$...' }. No plain-text names, amounts, or VPAs ever exist in the cloud database."),
        ("URL Fragment Transmission:", "The decryption key travels strictly in the client-side URL hash (#group=...&key=...), completely invisible to web servers and proxies.")
    ]

    ty = cy + dh_card - 0.95 * inch
    for title, desc in zk_points:
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 11.5)
        c.drawString(cx1 + 0.3 * inch, ty, "• " + title)
        ty -= 0.22 * inch
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 10.5)
        c.drawString(cx1 + 0.45 * inch, ty, desc[:70])
        ty -= 0.20 * inch
        if len(desc) > 70:
            c.drawString(cx1 + 0.45 * inch, ty, desc[70:])
            ty -= 0.24 * inch
        else:
            ty -= 0.15 * inch

    # Right Card: Greedy Debt Reduction
    cx2 = 6.8 * inch
    c.setFillColor(C_CARD)
    c.setStrokeColor(C_BORDER)
    c.roundRect(cx2, cy, dw_card, dh_card, 12, fill=True, stroke=True)

    c.setFillColor(C_PURPLE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(cx2 + 0.3 * inch, cy + dh_card - 0.5 * inch, "⚡ Greedy Min-Cash-Flow Algorithm")

    alg_points = [
        ("Net Balance Vector:", "Calculates net credit or debt for each member across both single and multi-payer bills: Net[i] = TotalPaid - FairShare."),
        ("Two-Pointer Matching:", "Concurrently matches the largest debtor with the largest creditor until all balances reach exact zero."),
        ("Mathematical Minimum:", "Reduces N*(N-1)/2 complex debts down to at most N-1 clean transactions."),
        ("Live Bidirectional Sync:", "Firestore onSnapshot listener updates all connected phones in real-time, backed by offline localStorage resilience.")
    ]

    ty = cy + dh_card - 0.95 * inch
    for title, desc in alg_points:
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 11.5)
        c.drawString(cx2 + 0.3 * inch, ty, "• " + title)
        ty -= 0.22 * inch
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 10.5)
        c.drawString(cx2 + 0.45 * inch, ty, desc[:70])
        ty -= 0.20 * inch
        if len(desc) > 70:
            c.drawString(cx2 + 0.45 * inch, ty, desc[70:])
            ty -= 0.24 * inch
        else:
            ty -= 0.15 * inch

    draw_footer(4)
    c.showPage()

    # =========================================================================
    # SLIDE 5: PRODUCT WALKTHROUGH
    # =========================================================================
    draw_background()
    draw_header("Product Walkthrough: Frictionless UX from Zero to Settled", "USER EXPERIENCE")

    psteps = [
        ("Step 1: 30-Sec Setup", "No signups, no passwords, no phone OTP. Type group name, add friends, and your workspace is live.", "Zero Onboarding Barrier"),
        ("Step 2: Add Expenses", "Choose single or multi-contributor bill. Select split members with live per-person fair share calculations.", "Ranked Category Analytics"),
        ("Step 3: Direct Settle", "View clear 'Who Pays Whom' banner. Tap 'Scan UPI QR' or launch Google Pay / PhonePe directly.", "1-Click UPI Payment"),
        ("Step 4: Share & Export", "1-click formatted WhatsApp report generator + CSV / Excel export for college project reimbursement.", "Audit & Submission Ready")
    ]

    for idx, (stitle, sdesc, sbadge) in enumerate(psteps):
        cx = 0.8 * inch + idx * (scard_w + 0.2 * inch)
        cy = PAGE_HEIGHT - 1.8 * inch - scard_h

        c.setFillColor(C_CARD)
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(1)
        c.roundRect(cx, cy, scard_w, scard_h, 12, fill=True, stroke=True)

        c.setFillColor(C_PURPLE)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(cx + 0.2 * inch, cy + scard_h - 0.55 * inch, stitle)

        c.setFillColor(C_WHITE)
        c.setFont("Helvetica", 11)
        words = sdesc.split()
        lines = []
        cur_line = ""
        for w in words:
            if len(cur_line + " " + w) > 28:
                lines.append(cur_line)
                cur_line = w
            else:
                cur_line += " " + w if cur_line else w
        if cur_line: lines.append(cur_line)

        ty = cy + scard_h - 1.05 * inch
        for line in lines:
            c.drawString(cx + 0.2 * inch, ty, line)
            ty -= 0.24 * inch

        # Badge
        c.setFillColor(HexColor("#1A253D"))
        c.setStrokeColor(C_GREEN)
        c.roundRect(cx + 0.2 * inch, cy + 0.4 * inch, scard_w - 0.4 * inch, 0.45 * inch, 6, fill=True, stroke=True)
        c.setFillColor(C_GREEN)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(cx + scard_w / 2, cy + 0.58 * inch, sbadge)

    draw_footer(5)
    c.showPage()

    # =========================================================================
    # SLIDE 6: COMPETITIVE MATRIX
    # =========================================================================
    draw_background()
    draw_header("Competitive Matrix: Why QuickSplit Wins", "COMPETITIVE ADVANTAGE")

    rows_data = [
        ("Feature Comparison", "QuickSplit IN", "Splitwise", "Manual WhatsApp / Excel"),
        ("Account / Signup Required", "❌ None (Instant Web Access)", "⚠️ Mandatory App & Account", "⚠️ Complex Setup"),
        ("Multi-Payer on a Single Bill", "✅ Full Uneven Multi-Pay", "⚠️ Clumsy / Paid Pro Tier", "❌ Manual Math Needed"),
        ("Direct Indian UPI Deep Links", "✅ 1-Click GPay, PhonePe, Paytm", "❌ No Native Indian Links", "❌ Manual Copy-Paste"),
        ("Zero-Knowledge Cloud Encryption", "✅ End-to-End Encrypted (E2EE)", "❌ Plain-Text Server DB", "❌ Unencrypted"),
        ("Dynamic UPI QR Generation", "✅ Instant Camera QR Scan", "❌ Static / None", "❌ None"),
        ("Pricing & Ads", "✅ 100% Free & No Ads", "❌ Paid Subscriptions & Ads", "✅ Free")
    ]

    tx = 0.8 * inch
    ty = PAGE_HEIGHT - 1.8 * inch
    tbl_w = PAGE_WIDTH - 1.6 * inch
    rh = 0.62 * inch

    col_widths = [3.8 * inch, 2.9 * inch, 2.5 * inch, 2.533 * inch]

    for r_idx, r_data in enumerate(rows_data):
        row_y = ty - (r_idx + 1) * rh
        for c_idx, cell_text in enumerate(r_data):
            col_x = tx + sum(col_widths[:c_idx])
            w = col_widths[c_idx]

            if r_idx == 0:
                c.setFillColor(C_CARD_HEADER)
                c.setStrokeColor(C_PURPLE)
                c.rect(col_x, row_y, w, rh, fill=True, stroke=True)
                c.setFillColor(C_PURPLE)
                c.setFont("Helvetica-Bold", 12)
            else:
                c.setFillColor(C_CARD if r_idx % 2 == 0 else HexColor("#10182B"))
                c.setStrokeColor(HexColor("#1E2A44"))
                c.rect(col_x, row_y, w, rh, fill=True, stroke=True)
                c.setFont("Helvetica-Bold" if c_idx == 1 else "Helvetica", 10.5)
                c.setFillColor(C_GREEN if c_idx == 1 else C_WHITE)

            if c_idx == 0:
                c.drawString(col_x + 0.15 * inch, row_y + 0.22 * inch, cell_text)
            else:
                c.drawCentredString(col_x + w / 2, row_y + 0.22 * inch, cell_text)

    draw_footer(6)
    c.showPage()

    # =========================================================================
    # SLIDE 7: MARKET OPPORTUNITY & ROADMAP
    # =========================================================================
    draw_background()
    draw_header("Market Opportunity & Milestone Roadmap", "MARKET & FUTURE")

    # Left: Market
    cx1 = 0.8 * inch
    cy = PAGE_HEIGHT - 1.8 * inch - dh_card
    c.setFillColor(C_CARD)
    c.setStrokeColor(C_BORDER)
    c.roundRect(cx1, cy, dw_card, dh_card, 12, fill=True, stroke=True)

    c.setFillColor(C_PURPLE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(cx1 + 0.3 * inch, cy + dh_card - 0.5 * inch, "🎯 High-Growth Target Audience")

    m_bullets = [
        ("3.5M+ College Project Students:", "Engineering & STEM teams buying IoT sensors, Raspberry Pi, robotics parts, 3D printing, and hackathon project servers."),
        ("15M+ Urban Roommates & Hostels:", "Young professionals and students splitting rent, Wi-Fi bills, Swiggy/Zomato bulk food orders, and groceries."),
        ("Zero Customer Acquisition Cost (CAC):", "Built-in organic viral loop: every settlement link automatically onboards 3 to 8 new active users with zero friction.")
    ]

    ty = cy + dh_card - 0.95 * inch
    for title, desc in m_bullets:
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(cx1 + 0.3 * inch, ty, "• " + title)
        ty -= 0.24 * inch
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 11)
        c.drawString(cx1 + 0.45 * inch, ty, desc[:68])
        ty -= 0.22 * inch
        if len(desc) > 68:
            c.drawString(cx1 + 0.45 * inch, ty, desc[68:])
            ty -= 0.28 * inch
        else:
            ty -= 0.20 * inch

    # Right: Roadmap
    cx2 = 6.8 * inch
    c.setFillColor(C_CARD)
    c.setStrokeColor(C_BORDER)
    c.roundRect(cx2, cy, dw_card, dh_card, 12, fill=True, stroke=True)

    c.setFillColor(C_GREEN)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(cx2 + 0.3 * inch, cy + dh_card - 0.5 * inch, "🗺️ Milestone Roadmap")

    r_bullets = [
        ("Phase 1 (Completed):", "Multi-payer splits, Greedy settlement algorithm, UPI deep-links & dynamic QR, Zero-Knowledge Firestore E2EE sync."),
        ("Phase 2 (In Development):", "Mobile Camera OCR Receipt Scanner to auto-extract line items & taxes from bill photos."),
        ("Phase 3 (Hackathon Scaling):", "Web3 Decentralized Settlement & Multi-Currency support for global hackathon teams."),
        ("Phase 4 (PWA Offline):", "Progressive Web App installation with native service worker caching.")
    ]

    ty = cy + dh_card - 0.95 * inch
    for title, desc in r_bullets:
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(cx2 + 0.3 * inch, ty, "• " + title)
        ty -= 0.24 * inch
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 11)
        c.drawString(cx2 + 0.45 * inch, ty, desc[:68])
        ty -= 0.22 * inch
        if len(desc) > 68:
            c.drawString(cx2 + 0.45 * inch, ty, desc[68:])
            ty -= 0.28 * inch
        else:
            ty -= 0.20 * inch

    draw_footer(7)
    c.showPage()

    # =========================================================================
    # SLIDE 8: SUMMARY & DEMO LINK
    # =========================================================================
    draw_background()

    # Big Card
    c.setFillColor(C_CARD)
    c.setStrokeColor(C_PURPLE)
    c.setLineWidth(2)
    c.roundRect(1.5 * inch, 0.9 * inch, PAGE_WIDTH - 3.0 * inch, PAGE_HEIGHT - 1.8 * inch, 16, fill=True, stroke=True)

    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 2.4 * inch, "⚡ QuickSplit IN")

    c.setFillColor(C_GREEN)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 3.0 * inch, "Precision Cost Allocation • Zero-Knowledge E2EE • Instant UPI Settlement")

    # Live Link Box
    c.setFillColor(HexColor("#1A253D"))
    c.setStrokeColor(C_PURPLE)
    c.setLineWidth(1.5)
    c.roundRect(PAGE_WIDTH / 2 - 3.5 * inch, PAGE_HEIGHT - 4.6 * inch, 7.0 * inch, 1.2 * inch, 12, fill=True, stroke=True)

    c.setFillColor(C_MUTED)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 3.8 * inch, "TRY THE LIVE WEB APP NOW:")

    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 4.25 * inch, "https://quickk-split.vercel.app/")

    c.setFillColor(C_MUTED)
    c.setFont("Helvetica", 12)
    c.drawCentredString(PAGE_WIDTH / 2, 1.6 * inch, "Open Source • Free Forever • Built for College Hackathons & Projects")

    draw_footer(8)
    c.showPage()

    c.save()
    print(f"PDF successfully generated at: {pdf_path}")

if __name__ == '__main__':
    build_pdf()
