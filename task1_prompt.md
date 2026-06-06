Task 1: Add i18n Translations

Files:
- Modify: /home/mo/Documents/gbay/apps/web/messages/en.json
- Modify: /home/mo/Documents/gbay/apps/web/messages/de.json

Step 1: Update en.json
Add "seller_orders" section before "SEO" section:
  "seller_orders": {
    "title": "Manage Orders",
    "back_to_dashboard": "Back to Dashboard",
    "filter_all": "All",
    "filter_pending": "Pending",
    "filter_shipped": "Shipped",
    "filter_delivered": "Delivered",
    "filter_cancelled": "Cancelled",
    "table_id": "Order ID",
    "table_date": "Date",
    "table_customer": "Customer",
    "table_total": "Total",
    "table_status": "Status",
    "table_actions": "Actions",
    "mark_shipped": "Mark as Shipped",
    "view_details": "View Details",
    "no_orders": "No orders found.",
    "ship_order_title": "Ship Order",
    "ship_order_desc": "Enter tracking information for order {orderId}",
    "carrier": "Carrier",
    "tracking_number": "Tracking Number",
    "confirm_ship": "Confirm Shipment",
    "cancel": "Cancel",
    "shipping_success": "Order marked as shipped",
    "shipping_error": "Failed to update order status"
  }

Step 2: Update de.json
Add "seller_orders" section before "SEO" section (translated):
  "seller_orders": {
    "title": "Bestellungen verwalten",
    "back_to_dashboard": "Zurück zum Dashboard",
    "filter_all": "Alle",
    "filter_pending": "Ausstehend",
    "filter_shipped": "Versandt",
    "filter_delivered": "Geliefert",
    "filter_cancelled": "Storniert",
    "table_id": "Bestell-ID",
    "table_date": "Datum",
    "table_customer": "Kunde",
    "table_total": "Gesamt",
    "table_status": "Status",
    "table_actions": "Aktionen",
    "mark_shipped": "Als versandt markieren",
    "view_details": "Details anzeigen",
    "no_orders": "Keine Bestellungen gefunden.",
    "ship_order_title": "Bestellung versenden",
    "ship_order_desc": "Geben Sie die Tracking-Informationen für Bestellung {orderId} ein",
    "carrier": "Versandunternehmen",
    "tracking_number": "Sendungsnummer",
    "confirm_ship": "Versand bestätigen",
    "cancel": "Abbrechen",
    "shipping_success": "Bestellung als versandt markiert",
    "shipping_error": "Fehler beim Aktualisieren des Bestellstatus"
  }

Step 3: Verify the changes and report DONE.
