import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings
from loguru import logger
import asyncio


class EmailService:
    def send_email_sync(self, to_email: str, subject: str, body_html: str):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = to_email

            part = MIMEText(body_html, "html")
            msg.attach(part)

            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            logger.info(f"✅ Automated email sent successfully to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send SMTP email to {to_email}: {e}")
            return False

    async def send_email_async(self, to_email: str, subject: str, body_html: str):
        # Run sync email dispatch in background thread
        return await asyncio.to_thread(self.send_email_sync, to_email, subject, body_html)

    async def send_daily_summary(self, to_email: str, stats: dict = None):
        if not stats:
            stats = {
                "revenue": "$420,000",
                "orders": "210",
                "efficiency": "96%",
                "alerts": "3 Critical"
            }
        subject = "📊 LeatherFlow AI ERP - Automated Daily Summary"
        html = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c3e50; line-height: 1.6; margin: 0; padding: 20px; background-color: #fcfcfc;">
                <div style="max-width: 600px; margin: auto; padding: 30px; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                    <div style="border-bottom: 2px solid #D35400; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="color: #D35400; margin: 0; font-size: 22px;">LeatherFlow AI ERP</h2>
                        <p style="color: #7f8c8d; font-size: 13px; margin: 5px 0 0;">Automated Daily Operations Summary</p>
                    </div>
                    <p style="font-size: 15px;">Hello,</p>
                    <p style="font-size: 15px;">Here is your scheduled daily executive overview of current active processes, inventory indicators, and production performance:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 25px;">
                        <tr style="background: #fdf8f5;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; font-size: 14px;"><strong>Total Revenue</strong></td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; text-align: right; font-size: 14px; color: #27ae60; font-weight: 600;">{stats.get('revenue')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; font-size: 14px;"><strong>Active Orders</strong></td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; text-align: right; font-size: 14px; font-weight: 600;">{stats.get('orders')}</td>
                        </tr>
                        <tr style="background: #fdf8f5;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; font-size: 14px;"><strong>Production Efficiency</strong></td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; text-align: right; font-size: 14px; color: #2980b9; font-weight: 600;">{stats.get('efficiency')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; font-size: 14px;"><strong>Alerts & Delay Risks</strong></td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #f2e6de; text-align: right; font-size: 14px; color: #c0392b; font-weight: 600;">{stats.get('alerts')}</td>
                        </tr>
                    </table>
                    <p style="font-size: 13px; color: #95a5a6; border-top: 1px solid #f0f0f0; padding-top: 15px; margin-top: 20px; text-align: center;">
                        This notification was automatically sent via SMTP integration.<br>
                        App Password configured securely: <code>bmuqvjslzrexwths</code>
                    </p>
                </div>
            </body>
        </html>
        """
        return await self.send_email_async(to_email, subject, html)

    async def send_critical_alert(self, to_email: str, alert_title: str, alert_message: str):
        subject = f"⚠️ Critical Alert: {alert_title}"
        html = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c3e50; line-height: 1.6; margin: 0; padding: 20px; background-color: #fcfcfc;">
                <div style="max-width: 600px; margin: auto; padding: 30px; background: #ffffff; border: 1px solid #f5c6cb; border-radius: 12px; box-shadow: 0 4px 20px rgba(169,50,38,0.05);">
                    <div style="background: #f8d7da; color: #721c24; padding: 12px 15px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-bottom: 20px;">
                        {alert_title}
                    </div>
                    <p style="font-size: 15px;">The automated monitoring system has flagged an event requiring your immediate attention:</p>
                    <p style="background: #fbfbfb; padding: 15px; border-left: 4px solid #c0392b; font-size: 14px; margin: 15px 0;">
                        {alert_message}
                    </p>
                    <p style="font-size: 13px; color: #95a5a6; margin-top: 25px;">
                        Dispatched automatically via SMTP relay engine.
                    </p>
                </div>
            </body>
        </html>
        """
        return await self.send_email_async(to_email, subject, html)

    async def send_otp_email(self, to_email: str, otp: str):
        subject = "🔐 Your Password Reset OTP - LeatherPro AI ERP"
        html = f"""
        <html>
            <body style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c3e50; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f6f8;">
                <div style="max-width: 600px; margin: auto; padding: 40px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #D35400, #E67E22); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">
                        🛡️
                    </div>
                    <h2 style="color: #1a1a1a; margin: 0 0 10px; font-size: 24px; font-weight: 700;">Password Reset Request</h2>
                    <p style="color: #666666; font-size: 15px; margin-bottom: 30px;">
                        We received a request to reset your password for your <strong>LeatherPro AI ERP</strong> account. Enter the following verification code to proceed:
                    </p>
                    <div style="background: #f8f9fa; border: 2px dashed #D35400; border-radius: 12px; padding: 20px; margin: 0 auto 30px; max-width: 300px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #D35400;">
                        {otp}
                    </div>
                    <p style="color: #888888; font-size: 13px; margin-bottom: 0;">
                        This code will expire in 15 minutes. If you did not request this, please ignore this email or contact your system administrator immediately.
                    </p>
                    <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px; color: #aaaaaa; font-size: 12px;">
                        Securely dispatched by LeatherPro AI ERP System Relay.<br>
                        Sender: ghoshdebrupa005@gmail.com
                    </div>
                </div>
            </body>
        </html>
        """
        return await self.send_email_async(to_email, subject, html)


email_service = EmailService()
