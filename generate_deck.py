import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    BG_DARK = RGBColor(10, 15, 29)       # #0A0F1D
    CARD_BG = RGBColor(20, 30, 51)       # #141E33
    CARD_BORDER = RGBColor(35, 50, 82)   # #233252
    ACCENT_PURPLE = RGBColor(99, 102, 241) # #6366F1
    ACCENT_GREEN = RGBColor(16, 185, 129)  # #10B981
    ACCENT_ORANGE = RGBColor(255, 153, 51) # #FF9933
    TEXT_LIGHT = RGBColor(248, 250, 252) # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8
    TEXT_DARK = RGBColor(15, 23, 42)

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.color.rgb = BG_DARK

    def add_header(slide, title, category="HACKATHON PITCH DECK"):
        # Category pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.38))
        pill.fill.solid()
        pill.fill.fore_color.rgb = CARD_BG
        pill.line.color.rgb = ACCENT_PURPLE
        pill.line.width = Pt(1)
        tf = pill.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.04)
        p = tf.paragraphs[0]
        p.text = f"⚡ {category}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_PURPLE
        p.alignment = PP_ALIGN.CENTER

        # Main Title
        txBox = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.8))
        tf = txBox.text_frame
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = TEXT_LIGHT

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1)

    # Glow card in center
    main_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5))
    main_card.fill.solid()
    main_card.fill.fore_color.rgb = CARD_BG
    main_card.line.color.rgb = ACCENT_PURPLE
    main_card.line.width = Pt(2)

    # Logo & Badge
    pill1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.7), Inches(1.5), Inches(3.9), Inches(0.45))
    pill1.fill.solid()
    pill1.fill.fore_color.rgb = RGBColor(30, 41, 69)
    pill1.line.color.rgb = ACCENT_GREEN
    p = pill1.text_frame.paragraphs[0]
    p.text = "⚡ LIVE ON VERCEL • PRODUCTION READY"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN
    p.alignment = PP_ALIGN.CENTER

    # Title
    t_box = slide1.shapes.add_textbox(Inches(1.5), Inches(2.2), Inches(10.3), Inches(1.2))
    p = t_box.text_frame.paragraphs[0]
    p.text = "QuickSplit IN"
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT
    p.alignment = PP_ALIGN.CENTER

    # Subtitle
    s_box = slide1.shapes.add_textbox(Inches(2.0), Inches(3.4), Inches(9.3), Inches(1.0))
    p = s_box.text_frame.paragraphs[0]
    p.text = "Zero-Knowledge Financial Settlement & Precision Cost Allocation\nfor College Projects, Roommates & Hackathon Teams"
    p.font.size = Pt(19)
    p.font.color.rgb = TEXT_MUTED
    p.alignment = PP_ALIGN.CENTER

    # Feature Highlights Pills Row
    feat_y = Inches(4.7)
    feats = [
        ("🛡️ Zero-Knowledge E2EE", ACCENT_GREEN),
        ("💸 Multi-Payer Bill Splitting", ACCENT_PURPLE),
        ("⚡ Greedy Debt Minimization", ACCENT_ORANGE),
        ("📱 1-Click UPI & Dynamic QR", ACCENT_GREEN)
    ]
    for idx, (label, col) in enumerate(feats):
        f_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.6 + idx * 2.55), feat_y, Inches(2.4), Inches(0.45))
        f_box.fill.solid()
        f_box.fill.fore_color.rgb = RGBColor(26, 36, 61)
        f_box.line.color.rgb = col
        f_box.line.width = Pt(1)
        p = f_box.text_frame.paragraphs[0]
        p.text = label
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_LIGHT
        p.alignment = PP_ALIGN.CENTER

    # URL Footer
    url_box = slide1.shapes.add_textbox(Inches(2.0), Inches(5.6), Inches(9.3), Inches(0.6))
    p = url_box.text_frame.paragraphs[0]
    p.text = "🔗 Live Web App: https://quickk-split.vercel.app/"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2)
    add_header(slide2, "The Problem: Why Existing Split Apps Break in India")

    problems = [
        ("1. Multi-Payer Invoicing Chaos", 
         "College hardware purchases (Raspberry Pi, PCB, cloud servers) frequently involve multiple teammates chipping in different amounts on one bill. Existing tools force only 1 payer per bill.",
         "❌ Inaccurate math & manual calculator friction"),
        ("2. Circular Debt Cascades",
         "5 teammates end up in 10 confusing back-and-forth bank transfers instead of a simplified minimal cash flow.",
         "❌ Unnecessary bank charges & confusion"),
        ("3. Privacy Leaks in the Cloud",
         "Standard apps store member phone numbers, bank UPI VPAs, and spending habits in plain text in centralized cloud databases.",
         "❌ Scraping, privacy abuse & data leaks"),
        ("4. Payment Friction & Amount Lock",
         "Copying UPI IDs manually is tedious, and pre-locked payment QR links often fail or get rejected by Indian banking apps.",
         "❌ Broken payment deep links & delay")
    ]

    for idx, (title, desc, impact) in enumerate(problems):
        row = idx // 2
        col = idx % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.85 + row * 2.5)

        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.65), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.2)
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = RGBColor(248, 113, 113)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

        p3 = tf.add_paragraph()
        p3.text = impact
        p3.font.size = Pt(12)
        p3.font.bold = True
        p3.font.color.rgb = ACCENT_ORANGE

    # =========================================================================
    # SLIDE 3: THE SOLUTION — QUICKSPLIT
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3)
    add_header(slide3, "The Solution: QuickSplit Architecture & Pillars")

    solutions = [
        ("⚡ Greedy Debt Simplifier", 
         "Min-Cash-Flow algorithm pairs net debtors with net creditors in optimal O(V) transfers. Eliminates all circular debts instantly.",
         ACCENT_PURPLE),
        ("👥 Multi-Contributor Bills", 
         "Supports bills where multiple friends contributed unevenly (e.g. Me paid ₹500, Friend 1 paid ₹300, Friend 2 paid ₹400).",
         ACCENT_GREEN),
        ("🛡️ Zero-Knowledge E2EE", 
         "All names, amounts, and UPI IDs are encrypted client-side using a salted AES cipher. The database holder sees 0 plain-text info.",
         ACCENT_ORANGE),
        ("📲 1-Click Native UPI Apps", 
         "Integrated deep links for Google Pay, PhonePe, Paytm, BHIM, CRED, plus dynamic client-side QR codes for instant settlement.",
         ACCENT_PURPLE)
    ]

    for idx, (title, desc, color) in enumerate(solutions):
        x = Inches(0.8 + idx * 2.95)
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.85), Inches(2.78), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = color
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.3)
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = color

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

    # =========================================================================
    # SLIDE 4: TECHNICAL INNOVATIONS & ZERO-KNOWLEDGE E2EE
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4)
    add_header(slide4, "Deep Dive: Zero-Knowledge Security & Real-Time Sync")

    # Left card: Encryption flow
    left_card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.85), Inches(5.7), Inches(4.8))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = CARD_BG
    left_card.line.color.rgb = CARD_BORDER

    tf = left_card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.3)
    p = tf.paragraphs[0]
    p.text = "🔒 Zero-Knowledge Cryptographic E2EE"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    items_left = [
        "Client-Side Key Derivation: Each group generates a private 12-char cryptographic key (e.g. QS-7K9A-2X4M).",
        "Salted AES-Keyed Cipher: Every sync bundles names, bills, amounts, and UPI VPAs with an 8-char random salt and 16-bit CRC checksum.",
        "Zero Cloud Visibility: Firestore receives ONLY { encData: 'ENC$...' }. No names, no amounts, and no UPI IDs exist in the database.",
        "Key Never Transmitted: The decryption key travels strictly in the client-side URL fragment (#group=...&key=...), never logged on servers."
    ]
    for it in items_left:
        p = tf.add_paragraph()
        p.text = "• " + it
        p.font.size = Pt(12.5)
        p.font.color.rgb = TEXT_LIGHT

    # Right card: Algorithm & Sync
    right_card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.85), Inches(5.7), Inches(4.8))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = CARD_BG
    right_card.line.color.rgb = CARD_BORDER

    tf = right_card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.3)
    p = tf.paragraphs[0]
    p.text = "⚡ Greedy Min-Cash-Flow Algorithm"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE

    items_right = [
        "Net Balance Vector: Calculates net credit/debt for every participant across single & multi-payer expenses.",
        "Two-Pointer Pairing: Concurrently matches maximum debtor with maximum creditor until all balances reach zero.",
        "Mathematical Minimum: Reduces N*(N-1)/2 complex debts down to at most N-1 clean transactions.",
        "Live Cloud Sync: Firestore onSnapshot real-time sync with automatic local-storage fallback for offline resilience."
    ]
    for it in items_right:
        p = tf.add_paragraph()
        p.text = "• " + it
        p.font.size = Pt(12.5)
        p.font.color.rgb = TEXT_LIGHT

    # =========================================================================
    # SLIDE 5: USER EXPERIENCE & FEATURE WALKTHROUGH
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5)
    add_header(slide5, "Product Walkthrough: Seamless UX & Zero Onboarding Barrier")

    steps = [
        ("Step 1: 30-Second Setup", "No signups, no logins, no phone verification. Enter project name, add friends, and start splitting.", "🚀 Zero Friction"),
        ("Step 2: Add Expenses", "Choose single or multi-contributor bill. Select split members with live per-person fair share calculations.", "📊 Ranked Analytics"),
        ("Step 3: Direct Settlement", "View clear 'Who Pays Whom' banner. Tap 'Scan UPI QR' or launch Google Pay / PhonePe directly.", "⚡ 1-Click Pay"),
        ("Step 4: Share & Export", "1-click formatted WhatsApp report generator + CSV / Excel export for college project bill reimbursement.", "📋 Audit Ready")
    ]

    for idx, (stitle, sdesc, sbadge) in enumerate(steps):
        x = Inches(0.8 + idx * 2.95)
        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.85), Inches(2.78), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.3)
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = ACCENT_PURPLE

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

        p3 = tf.add_paragraph()
        p3.text = sbadge
        p3.font.size = Pt(13)
        p3.font.bold = True
        p3.font.color.rgb = ACCENT_GREEN

    # =========================================================================
    # SLIDE 6: COMPETITIVE ADVANTAGE
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6)
    add_header(slide6, "Competitive Matrix: Why QuickSplit Wins")

    # Table layout
    rows = [
        ("Feature", "QuickSplit IN", "Splitwise", "WhatsApp/Manual Excel"),
        ("Signup / App Install Required", "❌ No (Instant Web Access)", "⚠️ Mandatory App & Account", "⚠️ Complex Setup"),
        ("Multi-Payer on a Single Bill", "✅ Full Uneven Multi-Pay Support", "⚠️ Clumsy / Paid Pro Feature", "❌ Manual Calculation"),
        ("Direct Indian UPI Deep Links", "✅ 1-Click GPay, PhonePe, Paytm", "❌ No Native Indian Deep-links", "❌ Copy-paste manually"),
        ("Zero-Knowledge Cloud Encryption", "✅ End-to-End Encrypted (E2EE)", "❌ Plain-text server DB", "❌ Unencrypted"),
        ("Direct QR Generation (Camera Scan)", "✅ Client-Side Dynamic QR", "❌ Static / None", "❌ None"),
        ("100% Free & No Ads", "✅ Completely Free & Open Source", "❌ Paywalled features & Ads", "✅ Free")
    ]

    t_x = Inches(0.8)
    t_y = Inches(1.85)
    t_w = Inches(11.733)
    t_h = Inches(4.8)

    table_shape = slide6.shapes.add_table(len(rows), 4, t_x, t_y, t_w, t_h)
    table = table_shape.table

    # Column widths
    table.columns[0].width = Inches(3.6)
    table.columns[1].width = Inches(3.0)
    table.columns[2].width = Inches(2.6)
    table.columns[3].width = Inches(2.533)

    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(12)
            p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT

            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(30, 41, 69)
                p.font.bold = True
                p.font.color.rgb = ACCENT_PURPLE
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = CARD_BG if r_idx % 2 == 0 else RGBColor(16, 24, 43)
                if c_idx == 1:
                    p.font.bold = True
                    p.font.color.rgb = ACCENT_GREEN
                else:
                    p.font.color.rgb = TEXT_LIGHT

    # =========================================================================
    # SLIDE 7: MARKET OPPORTUNITY & FUTURE ROADMAP
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7)
    add_header(slide7, "Market Opportunity & Product Roadmap")

    # Left: Market
    m_card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.85), Inches(5.7), Inches(4.8))
    m_card.fill.solid()
    m_card.fill.fore_color.rgb = CARD_BG
    m_card.line.color.rgb = CARD_BORDER

    tf = m_card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.3)
    p = tf.paragraphs[0]
    p.text = "🎯 High-Growth Target Audience"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE

    m_items = [
        "3.5M+ Engineering & Project Students: Buying IoT kits, robotics sensors, 3D printing, and hackathon project servers.",
        "15M+ Urban Roommates & Hostels: Splitting Wi-Fi, rent, Swiggy/Zomato bulk orders, and apartment groceries.",
        "Zero Customer Acquisition Cost (CAC): Natural viral loop — each shared settlement link automatically onboards teammates."
    ]
    for it in m_items:
        p = tf.add_paragraph()
        p.text = "• " + it
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_LIGHT

    # Right: Roadmap
    r_card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.85), Inches(5.7), Inches(4.8))
    r_card.fill.solid()
    r_card.fill.fore_color.rgb = CARD_BG
    r_card.line.color.rgb = CARD_BORDER

    tf = r_card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.3)
    p = tf.paragraphs[0]
    p.text = "🗺️ Next Milestone Roadmap"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    r_items = [
        ("Phase 1 (Completed)", "Multi-payer bills, Greedy settlement algorithm, UPI deep-links & dynamic QR, Zero-knowledge Firestore E2EE sync."),
        ("Phase 2 (In Development)", "Camera OCR Receipt Scanner to auto-extract line items & taxes from bill photos."),
        ("Phase 3 (Hackathon Scaling)", "Web3 decentralized settlement & multi-currency support for international hackathon teams."),
        ("Phase 4 (PWA Offline)", "Progressive Web App installation with service worker offline sync.")
    ]
    for phase, pdesc in r_items:
        p = tf.add_paragraph()
        p.text = f"{phase}: {pdesc}"
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_LIGHT

    # =========================================================================
    # SLIDE 8: SUMMARY & DEMO LINK
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8)

    end_card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.0), Inches(10.333), Inches(5.5))
    end_card.fill.solid()
    end_card.fill.fore_color.rgb = CARD_BG
    end_card.line.color.rgb = ACCENT_PURPLE
    end_card.line.width = Pt(2)

    tf = end_card.text_frame
    tf.word_wrap = True
    tf.margin_top = Inches(0.8)

    p = tf.paragraphs[0]
    p.text = "⚡ QuickSplit IN"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT
    p.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "Built for Hackathons, Engineering Projects & Modern Roommates"
    p2.font.size = Pt(20)
    p2.font.color.rgb = ACCENT_GREEN
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "\n🚀 Try the Live Web App Now:\nhttps://quickk-split.vercel.app/"
    p3.font.size = Pt(22)
    p3.font.bold = True
    p3.font.color.rgb = ACCENT_PURPLE
    p3.alignment = PP_ALIGN.CENTER

    p4 = tf.add_paragraph()
    p4.text = "\nOpen Source • Zero Knowledge • 1-Click UPI Settlement"
    p4.font.size = Pt(15)
    p4.font.color.rgb = TEXT_MUTED
    p4.alignment = PP_ALIGN.CENTER

    # Save
    out_path = r"c:\Users\mizaa\OneDrive\Desktop\Work\Anti Gravity IDE\QuickSplit\QuickSplit_Hackathon_Pitch_Deck.pptx"
    prs.save(out_path)
    print(f"Presentation saved successfully to: {out_path}")

if __name__ == '__main__':
    create_presentation()
