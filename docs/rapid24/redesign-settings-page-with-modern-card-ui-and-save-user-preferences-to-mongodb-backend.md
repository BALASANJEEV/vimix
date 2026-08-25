# Redesign Settings page with modern card UI and save user preferences to MongoDB backend

Repository: BALASANJEEV/vimix

When I open the Settings page in our CRM, the page looks completely unstyled and broken — all the text is squished into the top-left corner without any proper cards, margins, or styling.

Also, when I try to change my notification preferences and click the "Save Preferences" button, nothing happens and my changes disappear when I refresh the page.

Can you please fix this so that:
1. The Settings page has a modern, clean, centered layout with nice cards matching our Dashboard.
2. I can see and edit my Name and Email in a Profile section.
3. My notification checkboxes (Email alerts, Project updates) actually save to the database so that when I refresh or log back in later, my choices are still remembered.
4. It displays a "Preferences saved successfully!" confirmation message when I click Save.
