<script setup lang="ts">
import Footer from "../components/Footer.vue";
import Header from "../components/Header.vue";
import Container from "../components/Container.vue";
</script>

<template>
  <Header/>
  <Container class="px-2 legal">
    <h1>Terms of Service</h1>
    <p><b>Last Modified:</b> August 3, 2025</p>

    <p>
      Welcome to Level Thumbnails, a free and open-source modification for Geometry Dash that allows users to submit and
      share preview images for game levels.
    </p>

    <h2>1. Acceptance of Terms</h2>
    <p>
      By using Level Thumbnails (the "Service"), including our mod, website, API, or Discord server, you agree to be
      bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
    </p>

    <h2>2. Description of Service</h2>
    <p>Level Thumbnails provides:</p>
    <ul>
      <li>A Geometry Dash mod for submitting level preview images</li>
      <li>A web dashboard for managing submissions</li>
      <li>A public API for accessing approved thumbnails</li>
      <li>A Discord server for community interaction and support</li>
    </ul>
    <p>Our Service is completely free and open-source. All code is publicly available.</p>

    <h2>3. User Accounts and Authentication</h2>

    <h3>3.1 Account Creation</h3>
    <p>
      To use certain features of our Service, you must create an account. You can authenticate using either Discord
      OAuth
      or your Geometry Dash account through the Argon library system.
    </p>
    <ul>
      <li>You may authenticate using Discord OAuth and/or your Geometry Dash account</li>
      <li>
        For Geometry Dash authentication, we use the Argon library system which requires verification through an
        automated in-game bot message
      </li>
      <li>No traditional registration is required, but we store minimal account data for functionality</li>
    </ul>

    <h3>3.2 Account Requirements</h3>
    <p>To use our Service, you must meet the following requirements:</p>
    <ul>
      <li>You must be at least 13 years old (Discord's minimum age requirement)</li>
      <li>You must provide accurate information during authentication</li>
      <li>You are responsible for maintaining the security of your account credentials</li>
    </ul>

    <h2>4. User Content and Submissions</h2>

    <h3>4.1 Content Guidelines</h3>
    <p>
      Users can submit thumbnails for Geometry Dash levels through our Service. By submitting content, you agree to the
      following guidelines:
    </p>
    <ul>
      <li>Thumbnails must be appropriate and relevant to Geometry Dash levels</li>
      <li>Submissions must not contain offensive, illegal, or copyrighted material</li>
      <li>You may not submit content that violates the rights of others</li>
      <li>Submissions must comply with our community standards as published in our Discord server</li>
    </ul>

    <h3>4.2 Content Review Process</h3>
    <p>
      All submitted thumbnails are subject to review by our moderation team. We reserve the right to approve or reject
      any submission based on our content guidelines.
      Thumbnails must be appropriate, relevant to Geometry Dash levels, and comply with our community standards.
      Inappropriate content will be removed, and repeat offenders may have their accounts suspended or banned.
    </p>

    <h3>4.3 Content Ownership and License</h3>
    <p>
      By submitting thumbnails, you retain ownership of your content but grant us a non-exclusive, worldwide,
      royalty-free license to use, display, and distribute your thumbnails through our Service.
      You represent that you have the right to submit the content and that it does not violate any third-party rights.
      You also agree that we may modify or compress your thumbnails for performance optimization.
    </p>

    <h2>5. User Roles and Responsibilities</h2>

    <h3>5.1 User Types</h3>
    <p>Level Thumbnails has the following user roles:</p>
    <ul>
      <li><b>User:</b> Basic access, submissions require review</li>
      <li><b>Verified:</b> Immediate thumbnail publication</li>
      <li><b>Moderator:</b> Content review privileges</li>
      <li><b>Admin:</b> Full system access including role management and configuration</li>
    </ul>

    <h3>5.2 User Responsibilities</h3>
    <p>As a user of Level Thumbnails, you agree to:</p>
    <ul>
      <li>Use the Service in accordance with these Terms</li>
      <li>Follow community guidelines as published in our Discord server</li>
      <li>Respect other users and staff members</li>
      <li>Report any issues or violations to our moderation team</li>
      <li>Do not attempt to circumvent security measures or abuse the API</li>
      <li>Keep your account credentials secure and confidential</li>
    </ul>

    <h2>6. Prohibited Activities</h2>
    <p>You may not:</p>
    <ul>
      <li>Submit inappropriate, offensive, or illegal content</li>
      <li>Impersonate other users or entities</li>
      <li>Attempt to overwhelm our servers or API (beyond normal usage)</li>
      <li>Use the Service for commercial purposes without permission</li>
      <li>Violate any applicable laws or regulations</li>
      <li>Share account credentials with others</li>
    </ul>

    <h2>7. Content Moderation</h2>

    <h3>7.1 Staff Authority</h3>
    <p>Our moderation team has the authority to:</p>
    <ul>
      <li>Review and approve or reject submitted thumbnails</li>
      <li>Remove inappropriate content at their discretion</li>
      <li>Suspend or ban users for violations of these Terms</li>
      <li>Make final decisions on content disputes</li>
    </ul>

    <h3>7.2 Appeals Process</h3>
    <p>
      If you believe your content was unfairly moderated, you may appeal the decision by contacting our moderation team
      via Discord. Appeals will be reviewed on a case-by-case basis.
    </p>

    <h2>8. Service Availability</h2>

    <h3>8.1 Service Provision</h3>
    <p>
      We strive to provide a reliable and stable Service, but we cannot guarantee 100% uptime. The Service may be
      temporarily unavailable due to maintenance, updates, or unforeseen technical issues.
      We will notify users of planned maintenance in advance through our Discord server or website.
      We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice.
    </p>

    <h3>8.2 Technical Infrastructure</h3>
    <p>
      Our servers are located in Ukraine and use global content delivery via Cloudflare. We take reasonable measures to
      protect data and ensure availability, but disruptions may occur.
      In case of server downtime, users can still view thumbnails thanks to Cloudflare's caching system, but submissions
      and web dashboard access may be temporarily unavailable.
    </p>

    <h2>9. Intellectual Property</h2>

    <h3>9.1 Our Rights</h3>
    <p>
      The Level Thumbnails platform, codebase, and branding are protected under open-source and applicable intellectual
      property laws. You may not misrepresent or misuse the project.
      API and web interface is licensed under the Apache License 2.0, which allows for free use and modification
      as long as you comply with the license terms.
    </p>

    <h3>9.2 Third-Party Rights</h3>
    <ul>
      <li>Geometry Dash is a registered trademark of RobTop Games AB</li>
      <li>Discord is a registered trademark of Discord Inc.</li>
      <li>Users must respect all applicable copyright and trademark laws</li>
    </ul>

    <h2>10. Privacy and Data</h2>
    <p>
      Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect
      your information.
    </p>

    <h2>11. Disclaimers and Limitations</h2>

    <h3>11.1 Service Warranty</h3>
    <p>
      THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE
      UNINTERRUPTED OR ERROR-FREE OPERATION. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
    </p>

    <h3>11.2 Limitation of Liability</h3>
    <p>
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR
      CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
    </p>

    <h2>12. Termination</h2>

    <h3>12.1 Termination by You</h3>
    <p>You may stop using the Service at any time and request account deletion through our website settings.</p>

    <h3>12.2 Termination by Us</h3>
    <p>
      We may suspend or terminate your access for violations of these Terms, with or without notice, depending on the
      severity of the violation.
    </p>

    <h2>13. Changes to Terms</h2>
    <p>
      We may update these Terms from time to time. We will notify users of significant changes through our Discord
      server or website. Continued use of the Service constitutes acceptance of updated Terms.
    </p>

    <h2>14. Governing Law</h2>
    <p>
      These Terms are governed by the laws of Ukraine. Any disputes will be resolved in Ukrainian courts.
    </p>

    <h2>15. Contact Information</h2>
    <p>
      If you have any questions or concerns about these Terms, please contact us via our Discord server:
      <a href="https://discord.gg/GuagJDsqds">discord.gg/GuagJDsqds</a>.
    </p>

    <h2>16. Severability</h2>
    <p>
      If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and
      effect.
    </p>

    <hr/>

    <p>
      By using Level Thumbnails, you acknowledge that you have read, understood, and agree to be bound by these Terms of
      Service.
    </p>
  </Container>
  <Footer/>
</template>

<style scoped>
.legal {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: auto;
  padding: 20px;
}
</style>