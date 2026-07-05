<script setup lang="ts">
import Footer from "../components/Footer.vue";
import Header from "../components/Header.vue";
import Container from "../components/Container.vue";
</script>

<template>
  <Header/>
  <Container class="px-2 legal">
    <h1>Privacy Policy</h1>
    <p><b>Last Modified:</b> August 3, 2025</p>
    <p>
      Level Thumbnails ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how
      we collect, use, disclose, and safeguard your information when you use our Service.
    </p>

    <h2>1. Information We Collect</h2>

    <h3>1.1 Authentication Data</h3>
    <p>When you authenticate with our Service, we collect:</p>
    <ul>
      <li><b>Discord OAuth:</b> Discord user ID and username (if you choose Discord authentication)</li>
      <li><b>Geometry Dash Account:</b> Geometry Dash account ID and username (if you choose Argon authentication)</li>
      <li><b>Service-specific ID:</b> A unique identifier for your account on our Service</li>
      <li><b>User Role:</b> Your role on our Service (e.g., user, verified, moderator, admin)</li>
    </ul>

    <h3>1.2 Content Data</h3>
    <p>When you submit thumbnails, we collect:</p>
    <ul>
      <li><b>Thumbnails:</b> Level preview images you submit to our Service</li>
      <li><b>Metadata:</b> Information about your thumbnails, such as level ID and submission timestamp</li>
    </ul>

    <h3>1.3 Technical Data</h3>
    <p>We collect limited technical data to operate our Service:</p>
    <ul>
      <li><b>Cookies:</b> We use HttpOnly cookies to store authentication tokens for secure access to our Service</li>
      <li><b>Server Logs:</b> Standard web server logs for security and performance monitoring</li>
      <li><b>API Usage:</b> Request logs for rate limiting and abuse prevention</li>
      <li><b>Analytics:</b> Anonymized usage statistics to improve our Service (via Cloudflare)</li>
    </ul>

    <h3>1.4 Data We Do NOT Collect</h3>
    <p>We do not collect the following types of information:</p>
    <ul>
      <li>Email addresses</li>
      <li>Personal messages or private communications</li>
      <li>Financial information (our Service is completely free)</li>
      <li>Device fingerprinting or tracking beyond standard server logs</li>
      <li>Location data beyond what's provided by Cloudflare's network</li>
    </ul>

    <h2>2. How We Use Your Information</h2>

    <h3>2.1 Service Provision</h3>
    <p>We use your information to provide and maintain our Service:</p>
    <ul>
      <li>Authenticate your identity across our platforms</li>
      <li>Store and display your submitted thumbnails</li>
      <li>Manage your user role and permissions</li>
      <li>Provide access to our web dashboard and API</li>
    </ul>

    <h3>2.2 Content Moderation</h3>
    <p>We use your information to ensure the quality and safety of our Service:</p>
    <ul>
      <li>Review submitted thumbnails for policy compliance and quality</li>
      <li>Maintain service quality and safety</li>
      <li>Enforce our Terms of Service</li>
    </ul>

    <h3>2.3 Service Improvement</h3>
    <p>We use your information to:</p>
    <ul>
      <li>Monitor performance and uptime</li>
      <li>Analyze usage patterns to improve our Service</li>
      <li>Debug technical issues and security concerns</li>
    </ul>

    <h2>3. Information Sharing and Disclosure</h2>

    <h3>3.1 Public Information</h3>
    <p>Some of your information may be publicly accessible:</p>
    <ul>
      <li><b>Approved Thumbnails:</b> Publicly accessible via our API to all users</li>
      <li><b>Usernames:</b> May be displayed alongside approved submissions</li>
    </ul>

    <h3>3.2 Third-Party Services</h3>
    <p>We share limited data with:</p>
    <ul>
      <li>
        <b>Discord:</b>
        Through OAuth authentication
        (<a href="https://discord.com/privacy" target="_blank">Discord's privacy policy</a> applies)
      </li>
      <li>
        <b>Cloudflare:</b>
        For content delivery and security
        (see <a href="https://www.cloudflare.com/privacypolicy/" target="_blank">Cloudflare's privacy policy</a> for
        details)
      </li>
      <li>
        <b>Argon:</b>
        For Geometry Dash authentication
        (see <a href="https://github.com/GlobedGD/argon" target="_blank">Argon GitHub</a> for details)
      </li>
    </ul>

    <h3>3.3 We Do NOT Sell Data</h3>
    <p>We never sell, rent, or trade your personal information to third parties for commercial purposes.</p>

    <h3>3.4 Legal Requirements</h3>
    <p>
      We may disclose information if required by law, court order, or to protect the rights and safety of our Service
      and users.
    </p>

    <h2>4. Data Storage and Security</h2>

    <h3>4.1 Storage Location</h3>
    <ul>
      <li>Primary servers located in Ukraine</li>
      <li>Content delivered globally via Cloudflare's network</li>
      <li>All data stored securely with appropriate technical safeguards</li>
    </ul>

    <h3>4.2 Security Measures</h3>
    <p>
      We implement industry-standard security measures to protect your information, including:
    </p>
    <ul>
      <li>HttpOnly cookies for authentication</li>
      <li>Regular security monitoring and updates</li>
      <li>Access controls for staff members</li>
      <li>Secure transmission of data (HTTPS)</li>
    </ul>

    <h3>4.3 Data Retention</h3>
    <p>
      We retain your information for as long as necessary to provide our Service and fulfill the purposes outlined in
      this Privacy Policy. Specific retention periods include:
    </p>
    <ul>
      <li><b>User Accounts:</b> Stored until you request deletion</li>
      <li><b>Thumbnails:</b> Stored permanently unless replaced or removed by administration</li>
      <li><b>Logs:</b> Retained for reasonable periods for security and performance monitoring</li>
    </ul>

    <h2>5. Your Rights and Choices</h2>

    <h3>5.1 Access and Control</h3>
    <p>Through our website dashboard, you can:</p>
    <ul>
      <li>View your account information</li>
      <li>Manage your submitted thumbnails</li>
      <li>Update your authentication preferences</li>
      <li>Link/unlink Discord and Geometry Dash accounts</li>
    </ul>

    <h3>5.2 Data Portability (GDPR Compliance)</h3>
    <p>If you are a user in the European Union, you have the right to:</p>
    <ul>
      <li><b>Request Your Data:</b> Download all personal data we have about you</li>
      <li><b>Account Deletion:</b> Permanently delete your account and associated data</li>
    </ul>
    <p>These features are available in your account settings</p>

    <h3>5.3 Cookie Management</h3>
    <ul>
      <li>Our cookies are essential for Service functionality</li>
      <li>Disabling cookies will prevent you from using authenticated features</li>
      <li>You can clear cookies through your browser settings</li>
    </ul>

    <h2>6. International Data Transfers</h2>
    <p>
      Your information may be processed and stored in Ukraine and distributed globally through Cloudflare's network. By
      using our Service, you consent to this transfer and processing.
    </p>

    <h2>7. Children's Privacy</h2>
    <p>
      Our Service requires users to be at least 13 years old (Discord's minimum age). We do not knowingly collect
      personal information from children under 13. If we become aware of such collection, we will delete the information
      immediately.
    </p>

    <h2>8. Changes to This Privacy Policy</h2>
    <p>
      We may update this Privacy Policy periodically. We will notify users of significant changes through:
    </p>
    <ul>
      <li>Our Discord server announcements</li>
      <li>Updated "Last Modified" date on this policy</li>
    </ul>
    <p>
      Continued use of our Service after changes constitutes acceptance of the updated policy.
    </p>

    <h2>9. Open Source Transparency</h2>
    <p>
      As an open-source project, our data handling practices are transparent:
    </p>
    <ul>
      <li>Backend code is publicly available for review</li>
      <li>Community can audit our privacy practices</li>
      <li>Security vulnerabilities can be reported through our public repositories</li>
    </ul>

    <h2>10. Contact Information</h2>
    <p>
      For privacy-related questions or to exercise your rights:
    </p>
    <ul>
      <li><b>Discord Server:</b> <a href="https://discord.gg/GuagJDsqds">discord.gg/GuagJDsqds</a></li>
      <li><b>Data Requests:</b> Use the "Request my Data" or "Delete my Account" features in settings</li>
    </ul>

    <h2>11. Legal Basis for Processing (GDPR)</h2>
    <p>Where applicable, we process your data based on:</p>
    <ul>
      <li><b>Consent:</b> When you choose to authenticate and use our Service</li>
      <li><b>Legitimate Interest:</b> For service improvement, security, and content moderation</li>
      <li><b>Legal Obligation:</b> When required to comply with applicable laws</li>
    </ul>

    <h2>12. Data Protection Officer</h2>
    <p>
      For GDPR-related inquiries, you may contact us through the methods listed above. We will respond to valid requests
      within the required timeframes.
    </p>

    <hr/>

    <p>
      This Privacy Policy is effective as of the date listed above and governs your use of the Level Thumbnails Service.
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