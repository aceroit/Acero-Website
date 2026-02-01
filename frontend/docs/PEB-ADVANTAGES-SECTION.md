# How to show the Advantages of PEB section on the PEB page

The **Advantages of PEB** block (title + desktop/mobile SVGs) is rendered by the frontend when the PEB page has a section of type **PEB Advantage SVG**.

## Steps in the Admin Panel

1. **Open the PEB page**
   - Go to **Pages** in the admin panel.
   - Find and open the **PEB** page (slug: `peb`).

2. **Open Sections**
   - On the PEB page, go to the **Sections** tab (or click **Sections** / **Manage sections**).

3. **Add a section**
   - Click **Add Section** (or **Create First Section** if there are none).

4. **Choose section type**
   - In **Section Type**, select **PEB Advantages Graphic (Content)**.
   - You should see a short description and the PEB Advantage SVG editor (optional SVG URL). You can leave the optional field blank.

5. **Save and set order**
   - Save the section.
   - Set the **Order** so this section appears where you want (e.g. after “Application of PEB”).

6. **Publish**
   - **Publish the section** (and the page if needed) so the public API returns it. The frontend only shows published sections.

## If “PEB Advantages Graphic” is not in the dropdown

The section type must exist and be **active** in the database. If it’s missing:

1. Run the section types seeder (from the project root):
   ```bash
   node backend/seeders/sectionTypesExtended.seeder.js
   ```
   (or the seeder file your project uses for section types.)

2. In the admin, go to **Section Types** and confirm **PEB Advantages Graphic** (`peb_advantage_svg`) exists and is active.

3. Then add the section to the PEB page as above.

## What the frontend shows

- **Title:** “Advantages of PEB”
- **Desktop (lg+):** `/svgs/peb-advantage.svg`
- **Mobile:** `/svgs/peb-advantage-sm.svg`

No content is required in the admin except adding this section to the PEB page and publishing it.
