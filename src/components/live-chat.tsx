import Script from "next/script";

/**
 * tawk.to live chat. Off until the client's tawk.to IDs are set as environment variables:
 *   NEXT_PUBLIC_TAWK_PROPERTY_ID=xxxxxxxxxxxxxxxxxxxxxxxx
 *   NEXT_PUBLIC_TAWK_WIDGET_ID=default
 * (tawk.to dashboard → Administration → Chat Widget → Direct Chat Link)
 */
export function LiveChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID ?? "default";
  if (!propertyId || !/^[a-z0-9]+$/i.test(propertyId) || !/^[a-z0-9]+$/i.test(widgetId)) return null;

  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src="https://embed.tawk.to/${propertyId}/${widgetId}";s1.charset="UTF-8";s1.setAttribute("crossorigin","*");s0.parentNode.insertBefore(s1,s0);})();`}
    </Script>
  );
}
