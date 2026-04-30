# XDMails Media Upload Feature

## Overview

The XDMails module now includes a comprehensive media management system that allows users to upload, manage, and insert images and videos into email campaigns. All media is stored on Cloudinary CDN for fast, reliable delivery.

## Features

### 📤 Media Upload

- **Supported formats**: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
- **File size limits**:
  - Images: 10MB max
  - Videos: 500MB max
- **Storage**: Cloudinary CDN
- **Automatic optimization**: Images are automatically optimized for email delivery

### 📚 Media Library

- **Organized tabs**: Separate views for images and videos
- **Grid layout**: Visual preview of all uploaded media
- **Search & filter**: Easy to find specific media
- **Quick actions**: Insert, copy URL, or delete

### 🎨 Email Integration

- **One-click insert**: Add media directly to email content
- **Responsive rendering**: Images and videos automatically scale
- **Email-safe**: Properly formatted for email clients
- **Video support**: Videos render with controls in supported email clients

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Navigate to Dashboard to get your credentials

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Folder Structure

Media is automatically organized in Cloudinary:

```
xdmails/
├── images/
└── videos/
```

## Usage Guide

### Uploading Media

1. **Open XDComposer** tab in XDMails
2. **Click "Media Library"** button in the toolbar
3. **Click "Upload Media"** button
4. **Select file** (image or video)
5. **Wait for upload** - progress indicator shows status
6. **Media appears** in the appropriate tab

### Inserting Media into Emails

**Method 1: From Media Library**

1. Click "Media Library" button
2. Browse images or videos tab
3. Click "Insert" on desired media
4. Media is added to email at cursor position

**Method 2: Copy URL**

1. Click copy icon on any media
2. URL is copied to clipboard
3. Use URL in custom HTML or external tools

### Managing Media

**View Media**

- Images: Grid view with thumbnails
- Videos: Grid view with video players
- Hover for quick actions

**Delete Media**

1. Click trash icon on media card
2. Confirm deletion
3. Media removed from Cloudinary and database

## Technical Details

### Database Schema

```typescript
{
  url: string; // Cloudinary URL
  publicId: string; // Cloudinary public ID
  type: "image" | "video";
  filename: string; // Original filename
  size: number; // File size in bytes
  uploadedBy: ObjectId; // User who uploaded
  createdAt: Date;
}
```

### API Actions

- `uploadMedia(formData)` - Upload file to Cloudinary
- `getMedia(type?)` - Retrieve all media or filter by type
- `deleteMedia(id)` - Delete from Cloudinary and database

### Image Optimization

Images are automatically optimized:

- Max dimensions: 1200x1200px
- Quality: Auto (Cloudinary smart compression)
- Format: Auto (best format for email)

### Email Rendering

**Images:**

```html
<img
  src="cloudinary_url"
  style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:8px;"
/>
```

**Videos:**

```html
<video
  controls
  style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:8px;"
>
  <source src="cloudinary_url" type="video/mp4" />
  Your email client doesn't support videos.
</video>
```

## Email Client Compatibility

### Images

✅ **Fully Supported**: All major email clients

- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Thunderbird

### Videos

⚠️ **Limited Support**: Not all email clients support embedded videos

**Supported:**

- Apple Mail (iOS/macOS)
- Outlook for Mac
- Thunderbird

**Not Supported:**

- Gmail (shows fallback text)
- Outlook (Windows)
- Yahoo Mail

**Best Practice**: For maximum compatibility, use video thumbnails that link to hosted videos.

## File Size Limits

- **Images**: 10MB max per file
- **Videos**: 500MB max per file
- **Total storage**: Depends on Cloudinary plan
- **Free tier**: 25GB storage, 25GB bandwidth/month

## Security

- ✅ Upload restricted to ops, admin, and superadmin roles
- ✅ Files validated before upload
- ✅ Cloudinary handles secure storage
- ✅ URLs are public but unpredictable
- ✅ Media deletion removes from both DB and Cloudinary

## Performance

- **CDN delivery**: Fast global access via Cloudinary CDN
- **Lazy loading**: Media library loads on demand
- **Optimized images**: Automatic compression and format selection
- **Caching**: Browser and CDN caching for repeat views

## Troubleshooting

### Upload Fails

- Check file size (images < 10MB, videos < 500MB)
- Verify file type (images or videos only)
- Confirm Cloudinary credentials in `.env.local`
- Check Cloudinary dashboard for quota limits

### Media Not Displaying

- Verify Cloudinary URL is accessible
- Check email client video support
- Ensure proper internet connection
- Review browser console for errors

### Slow Uploads

- Large files take longer (compress before upload)
- Check internet connection speed
- Cloudinary free tier has bandwidth limits

## Best Practices

1. **Optimize before upload**: Compress large files
2. **Use descriptive filenames**: Easier to find later
3. **Delete unused media**: Keep library organized
4. **Test emails**: Preview in multiple email clients
5. **Video alternatives**: Provide image fallbacks for videos
6. **Responsive design**: Media auto-scales for mobile

## Future Enhancements

- [ ] Bulk upload support
- [ ] Image editing tools
- [ ] Video thumbnail generation
- [ ] Media folders/categories
- [ ] Search and filter functionality
- [ ] Usage analytics
- [ ] Automatic alt text generation
- [ ] GIF support optimization

## Support

For issues with:

- **Cloudinary**: Check [Cloudinary docs](https://cloudinary.com/documentation)
- **Email rendering**: Test with [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com)
- **XDMails**: Contact development team
