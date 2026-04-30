# Gmail Emoji Rendering Fix

## The Problem

When emails containing emojis are sent and viewed in **Gmail web interface** (desktop), emojis appear as large, blurry images instead of crisp inline characters. This is a known issue with Gmail's "goomoji" image replacement system.

### Why This Happens

Gmail has an **image replacement function** that runs in the browser AFTER the email is received. This means:

1. **Automatic Conversion**: Gmail converts Unicode emoji characters into `<img>` tags pointing to their emoji image library (gstatic.com or mail.google.com/mail/e/)
2. **Old Emoji Set**: Gmail uses outdated Android 7.0 emoji designs (from 2016)
3. **Default Size**: Gmail's emoji images default to 24px or larger, making them appear oversized
4. **Broken Sequences**: Complex emojis (skin tones, gender variants) often break into multiple separate images

### Important Facts

- **Cannot Be Prevented**: The emoji-to-image conversion happens on Gmail's side in the browser. We cannot prevent it from the sender side.
- **Gmail Mobile**: Works perfectly - uses native system emoji fonts
- **Other Email Clients**: Work fine (Outlook, Apple Mail, Thunderbird, etc.)
- **No Official Fix**: Google has acknowledged this but hasn't provided a complete solution as of 2026

## Our Solution

Since we cannot prevent Gmail from converting emojis to images, we instead **control the size** of those images using CSS that Gmail respects.

### Implementation in `actions/emails.ts`

We target Gmail's emoji images using multiple selectors to ensure we catch all variations:

```css
/* Target Gmail's emoji images specifically */
img[goomoji],
img[data-emoji],
img.emoji,
img[src*="gstatic.com"],
img[src*="mail.google.com/mail/e/"] {
  display: inline !important;
  width: 1em !important;
  height: 1em !important;
  max-width: 1em !important;
  max-height: 1em !important;
  min-width: 1em !important;
  min-height: 1em !important;
  margin: 0 0.05em !important;
  padding: 0 !important;
  vertical-align: -0.1em !important;
  border: none !important;
  background: none !important;
  border-radius: 0 !important;
}
```

### What This Does

1. **Targets Gmail's Emoji Images**: Uses multiple selectors to catch:
   - `img[goomoji]` - Gmail's original emoji attribute
   - `img[data-emoji]` - Gmail's data attribute for emojis
   - `img.emoji` - Generic emoji class
   - `img[src*="gstatic.com"]` - Google's static content domain
   - `img[src*="mail.google.com/mail/e/"]` - Gmail's emoji URL pattern

2. **Forces Inline Size**: Sets size to `1em` (matches surrounding text size)

3. **Prevents Overrides**: Uses `!important` to override Gmail's default styles

4. **Maintains Regular Images**: The media query ensures regular content images remain full-width on mobile

## Testing Results

### Expected Behavior

**Gmail Web (Desktop):**

- ✅ Emojis appear at text size (1em)
- ✅ Emojis are inline with text
- ⚠️ May still use old Android 7.0 designs
- ⚠️ Complex emojis (skin tones) may still break into parts

**Gmail Mobile:**

- ✅ Perfect - uses native system emojis
- ✅ All modern emojis supported
- ✅ Proper rendering of skin tones and gender variants

**Other Clients:**

- ✅ Perfect - use native system emojis
- ✅ No conversion to images

### Test Campaign

Create a test with various emoji types:

```
Subject: Emoji Test ✨

Hello! 😊 Welcome to our service! 🎉

Features:
✅ Fast delivery
⭐ Great quality
❤️ Customer support
📧 Email: info@ayothealthsolutions.ke

Simple emojis: 😀 🎈 🌟 💯
Symbols: ✓ ✗ ⚠️ ℹ️
```

## Known Limitations

### 1. Cannot Prevent Conversion

Gmail will ALWAYS convert emojis to images in the web interface. This is Gmail's behavior, not something we control.

### 2. Old Emoji Designs

Gmail uses Android 7.0 emoji designs from 2016. Users will see outdated emoji styles compared to modern platforms.

### 3. Complex Emojis May Break

Multi-part emojis may still display incorrectly:

- ❌ 👨‍👩‍👧‍👦 (Family)
- ❌ 👋🏽 (Waving hand with skin tone)
- ❌ 🏳️‍🌈 (Rainbow flag)

### 4. Blurriness

Gmail's emoji images are low-resolution PNGs. At 1em size they should be acceptable, but may not be as crisp as native fonts.

## Recommendations for Users

### ✅ DO Use These Emojis

Simple, single-character emojis work best:

- Faces: 😊 😂 🥰 😎 🤔
- Symbols: ✅ ⭐ ❤️ 💯 🎉
- Objects: 📧 📱 💼 🏠 🚀

### ⚠️ AVOID These Emojis

Complex multi-part emojis may break:

- Skin tone variants: 👋🏽 👍🏿 🤝🏻
- Gender variants: 👨‍⚕️ 👩‍💻 🧑‍🎨
- Multi-person: 👨‍👩‍👧 👬 👭
- Flag sequences: 🏳️‍🌈 🏴‍☠️

### Best Practices

1. **Test First**: Send test email to Gmail before bulk campaigns
2. **Use Sparingly**: 2-3 emojis per email is professional
3. **Stick to Simple**: Use basic emojis without modifiers
4. **Check Mobile**: Verify how it looks on Gmail mobile app
5. **Consider Alternatives**: For critical visuals, use actual images instead

## Technical References

Based on research from:

- [Emojipedia: Gmail's Outdated Emoji Support](https://blog.emojipedia.org/gmails-outdated-emoji-support/)
- [Stack Overflow: Prevent Unicode to Emoji Conversion](https://stackoverflow.com/questions/70212579/)
- [Web Apps Stack Exchange: Gmail Emoji Transformation](https://webapps.stackexchange.com/questions/84616/)

## Status

- ✅ **Solution Implemented**: CSS targeting Gmail's emoji images
- ✅ **Size Control**: Emojis forced to 1em (text size)
- ⚠️ **Conversion Cannot Be Prevented**: Gmail will still convert to images
- 🧪 **Testing Required**: Verify in Gmail web interface
- 📝 **Documentation**: Complete

---

**Bottom Line**: We cannot stop Gmail from converting emojis to images, but we can control their size to make them appear inline with text at the correct size. The solution targets Gmail's specific emoji image attributes and forces them to 1em size.

Last Updated: April 30, 2026
