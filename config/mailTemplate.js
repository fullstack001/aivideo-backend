import dotenv from "dotenv";
dotenv.config();

const style = `<style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f3f4f6;
                    margin: 0;
                    padding: 0;
                }

                .email-container {
                    background-color: #fefefe;
                    margin: 20px auto;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    max-width: 600px;
                }

                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    text-align: center;
                    text-decoration: none;
                    outline: none;
                    color: #fff !important;
                    background-color: #007bff;
                    border: none;
                    border-radius: 5px;
                    box-shadow: 0 4px #999;
                }
                .ii a[href] {
                    color: #fff;
                }

                .button:hover {background-color: #0069d9}

                .button:active {
                    background-color: #0069d9;
                    box-shadow: 0 2px #666;
                    transform: translateY(2px);
                }
                a {
                    color:#fff
                }

                p {
                    font-size: 16px;
                    color: #333;
                }
                ul{
                    font-size: 16px;
                    color: #333;
                }
            </style>`;

// export function resetPasswordLink(token) {
//   const resetLink = `https://streamdash.co/reset-password/${token}`;
//   return `<!DOCTYPE html>
//             <html>
//             <head>
//                 ${style}
//             </head>
//             <body>
//                 <div class="email-container">
//                     <p>Dear User,</p>
//                     <p>We received a request to reset your streamdash account password. If you made this request, please click the link below to reset your password:</p>
//                     <a href="${resetLink}" class="button">Reset Password</a>
//                     <p>For your security, this link will expire in 24 hours. If you didn’t request a password reset, you can safely ignore this email—your account will remain secure.</p>
//                     <p>If you need further assistance, don’t hesitate to contact us at support@streamdash.com.</p>
//                     <p>Stay streaming!  <br>
//                     The streamdash Team</p>
//                     <p>---</p>
//                     <p>**Note:** Never share your password with anyone. Always use a strong, unique password to keep your account secure.</p>
//                 </div>
//             </body>
//             </html>`;
// }

export function validationCodeContent(userName, code) {
  return `<!DOCTYPE html>
            <html>
            <head>
                ${style}
            </head>
            <body>
                <div class="email-container">
                    <p>Dear ${userName},</p>
                    <p>Welcome to <strong>BestGlobalAl</strong>! We're thrilled to have you on board.</p>
                    <p>To complete your setup, please verify your email using the code below:</p>
                    <div class="button">${code}</div>
                    <p>Once verified, you'll get instant access to:</p>
                    <ul>
                     <li>AI-powered interactive avatars</li>
                     <li>Automated social media and email campaigns</li>
                     <li>Advanced analytics and insights</li>
                    </ul>
                    <p>If you have any questions, reach us at:</p>
                    <p><strong>support@bestglobalal.com</strong></p>
                    <p>We're excited to help you get started!</p>
                    <p>Best regards,<br>
                    The BestGlobalAl Team</p>
                </div>
            </body>
            </html>`;
}

// export function validationOPTContent(code) {
//   return `<!DOCTYPE html>
//             <html>
//             <head>
//                 ${style}
//             </head>
//             <body>
//                 <div class="email-container">
//                     <p>Dear User,</p>
//                     <p>We've received a request to update the email address associated with your StreamDash account. </p>
//                     <p>To ensure the security of your account, please verify your new email address by entering the One-Time Password (OTP) below:</p>
//                     <div class="button">${code}</div>
//                     <p>Please enter this code in the verification field within the next 10 minutes to confirm the email change.</p>
//                     <p>If you did not request this change, please contact our support team immediately to secure your account. </p>
//                     <p>Thank you for being a part of StreamDash!</p>
//                     <p>Stay streaming,<br>
//                     streamdash Support Team</p>
//                 </div>
//             </body>
//             </html>`;
// }

// export function purchaseEmainContent(userName, credit, date, amount) {
//   return `<!DOCTYPE html>
//             <html>
//             <head>
//                 ${style}
//             </head>
//             <body>
//                 <div class="email-container">
//                     <p>Dear User,</p>
//                     <p>Thank you for your recent purchase of credits on streamdash! We're excited to help you enjoy even more of your favorite content.</p>
//                     <p>Here are the details of your purchase:</p>
//                     <p>- Credits Purchased: ${credit}</p>
//                     <p>- Purchase Date: ${date}</p>
//                     <p>- Total Amount: $${amount}</p>
//                     <p>Your credits are now available in your account, and you can use them to add devices and connect.</p>
//                     <p>To start using your credits, simply log in to your account: </p>
//                               <a href="https://streamdash.co/login" class="button">Log In to streamdash</a>
//                     <p>If you have any questions or need assistance, our support team is here to help at  </p>
//                     <p>support@streamdash.com. </p>
//                     <p>Looking forward to streaming with you!</p>
//                     <p>Happy streaming!  ,<br>
//                     The streamdash Team</p>
//                 </div>
//             </body>
//             </html>`;
// }

// export function trailContent(userName) {
//   return `<!DOCTYPE html>
//             <html>
//             <head>
//                 ${style}
//             </head>
//             <body>
//                 <div class="email-container">
//                     <p>Dear User,</p>
//                     <p>Great news—your free trial with streamdash is now active! Your trial will be active for 2 days once you connect your device.</p>
//                     <p>To get started, simply log in and add your device: </p>
//                     <a href="https://streamdash.co/login" class="button">Log In to streamdash</a>
//                     <p>Remember, your trial will automatically expire after 2 days of adding the device. </p>
//                     <p>If you need any help or have questions, contact us at  </p>
//                     <p>support@streamdash.com. </p>
//                     <p>Enjoy your streamdash experience! <br>
//                     The streamdash Team</p>
//                 </div>
//             </body>
//             </html>`;
// }

// export function changeEmailContent(email) {
//   return `<!DOCTYPE html>
//             <html>
//             <head>
//                 ${style}
//             </head>
//             <body>
//                 <div class="email-container">
//                     <p>Dear User,</p>
//                     <p>We wanted to let you know that your email address has been successfully updated on streamdash.</p>
//                     <p> From now on, all account-related communications will be sent to your new email address: </p>
//                     <p>${email}<p>
//                     <p>If you didn’t request this change, please contact our support team immediately to secure your account.</p>
//                     <p>Thank you for being a part of streamdash! </p>
//                     <p>Stay streaming!<br>
//                     The streamdash Team</p>
//                 </div>
//             </body>
//             </html>`;
// }
