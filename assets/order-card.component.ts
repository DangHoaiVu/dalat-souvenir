import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  receiptOutline, timeOutline, cubeOutline,
  personOutline, callOutline, locationOutline,
  chevronUpOutline, chevronDownOutline,
} from 'ionicons/icons';
import { SellerOrder } from 'src/app/models/seller-order.model';

@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
})
export class OrderCardComponent {
  @Input() order!: SellerOrder;

  expanded = false;

  constructor() {
    addIcons({
      receiptOutline, timeOutline, cubeOutline,
      personOutline, callOutline, locationOutline,
      chevronUpOutline, chevronDownOutline,
    });
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  get googleMapsLink(): string | null {
    const lat = Number(this.order?.buyerLatitude);
    const lng = Number(this.order?.buyerLongitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
}
