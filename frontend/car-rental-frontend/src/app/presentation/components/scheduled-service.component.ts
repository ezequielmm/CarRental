import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiService } from '../../infrastructure/services/api.service';

interface ScheduledService {
  id: number;
  carId: number;
  carBrand: string;
  carModel: string;
  licensePlate: string;
  serviceType: string;
  scheduledDate: Date;
  estimatedDuration: number;
  locationName: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface ServiceSummary {
  totalServices: number;
  upcomingServices: number;
  criticalServices: number;
  averageDuration: number;
  mostServicedCarType: string;
}

@Component({
  selector: 'app-scheduled-service',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  template: `
    <div class="service-dashboard-container">
      <div class="dashboard-header">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Service Schedule Dashboard</mat-card-title>
            <mat-card-subtitle>Upcoming vehicle maintenance for the next 2 weeks</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              Refresh Data
            </button>
            <button mat-stroked-button (click)="exportSchedule()">
              <mat-icon>download</mat-icon>
              Export Schedule
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
          <p>Loading service schedule...</p>
        </div>
      }

      @if (serviceSummary() && !isLoading()) {
        <!-- Service Summary Cards -->
        <div class="summary-grid">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon class="summary-icon services">build</mat-icon>
                <div class="summary-details">
                  <h3>{{ serviceSummary()?.totalServices || 0 }}</h3>
                  <p>Total Services</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon class="summary-icon upcoming">schedule</mat-icon>
                <div class="summary-details">
                  <h3>{{ serviceSummary()?.upcomingServices || 0 }}</h3>
                  <p>Upcoming This Week</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card critical" [class.alert]="(serviceSummary()?.criticalServices || 0) > 0">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon class="summary-icon critical">warning</mat-icon>
                <div class="summary-details">
                  <h3>{{ serviceSummary()?.criticalServices || 0 }}</h3>
                  <p>Critical Priority</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon class="summary-icon duration">timer</mat-icon>
                <div class="summary-details">
                  <h3>{{ formatDuration(serviceSummary()?.averageDuration || 0) }}</h3>
                  <p>Avg. Duration</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Service Schedule Table -->
        <mat-card class="schedule-table-card">
          <mat-card-header>
            <mat-card-title>
              Service Schedule
              @if (upcomingServices().length > 0) {
                <mat-icon [matBadge]="upcomingServices().length" matBadgeColor="warn">event_note</mat-icon>
              }
            </mat-card-title>
            <mat-card-subtitle>Next 14 days of scheduled maintenance</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            @if (upcomingServices().length > 0) {
              <div class="table-container">
                <table mat-table [dataSource]="upcomingServices()" class="service-table">
                  <ng-container matColumnDef="priority">
                    <th mat-header-cell *matHeaderCellDef>Priority</th>
                    <td mat-cell *matCellDef="let service">
                      <mat-chip [class]="'priority-chip priority-' + service.priority.toLowerCase()">
                        {{ service.priority }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="vehicle">
                    <th mat-header-cell *matHeaderCellDef>Vehicle</th>
                    <td mat-cell *matCellDef="let service">
                      <div class="vehicle-info">
                        <strong>{{ service.carBrand }} {{ service.carModel }}</strong>
                        <small>{{ service.licensePlate }}</small>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="serviceType">
                    <th mat-header-cell *matHeaderCellDef>Service Type</th>
                    <td mat-cell *matCellDef="let service">
                      <div class="service-type">
                        <mat-icon>{{ getServiceIcon(service.serviceType) }}</mat-icon>
                        <span>{{ service.serviceType }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="scheduledDate">
                    <th mat-header-cell *matHeaderCellDef>Scheduled Date</th>
                    <td mat-cell *matCellDef="let service">
                      <div class="date-info">
                        <strong>{{ formatDate(service.scheduledDate) }}</strong>
                        <small [class]="getDateClass(service.scheduledDate)">
                          {{ getRelativeDate(service.scheduledDate) }}
                        </small>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="duration">
                    <th mat-header-cell *matHeaderCellDef>Duration</th>
                    <td mat-cell *matCellDef="let service">
                      {{ formatDuration(service.estimatedDuration) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="location">
                    <th mat-header-cell *matHeaderCellDef>Location</th>
                    <td mat-cell *matCellDef="let service">
                      <div class="location-info">
                        <mat-icon>location_on</mat-icon>
                        <span>{{ service.locationName }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let service">
                      <mat-chip [class]="'status-chip status-' + service.status.toLowerCase()">
                        {{ service.status }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let service">
                      <div class="action-buttons">
                        <button mat-icon-button [matMenuTriggerFor]="actionMenu" 
                                [attr.aria-label]="'Actions for service ' + service.id">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #actionMenu="matMenu">
                          <button mat-menu-item (click)="viewServiceDetails(service)">
                            <mat-icon>visibility</mat-icon>
                            <span>View Details</span>
                          </button>
                          <button mat-menu-item (click)="rescheduleService(service)">
                            <mat-icon>schedule</mat-icon>
                            <span>Reschedule</span>
                          </button>
                          <button mat-menu-item (click)="markCompleted(service)">
                            <mat-icon>check_circle</mat-icon>
                            <span>Mark Completed</span>
                          </button>
                        </mat-menu>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                      [class.overdue]="isOverdue(row.scheduledDate)"
                      [class.critical-row]="row.priority === 'Critical'"></tr>
                </table>
              </div>
            } @else {
              <div class="no-services">
                <mat-icon>event_available</mat-icon>
                <h3>No Scheduled Services</h3>
                <p>There are no vehicle services scheduled for the next 2 weeks.</p>
                <button mat-raised-button color="primary" (click)="scheduleNewService()">
                  <mat-icon>add</mat-icon>
                  Schedule New Service
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Service Calendar View -->
        <mat-card class="calendar-card">
          <mat-card-header>
            <mat-card-title>Calendar View</mat-card-title>
            <mat-card-subtitle>Service distribution over the next 2 weeks</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="calendar-grid">
              @for (week of calendarWeeks(); track week.weekStart) {
                <div class="calendar-week">
                  <h4>Week of {{ formatWeek(week.weekStart) }}</h4>
                  <div class="week-days">
                    @for (day of week.days; track day.date) {
                      <div class="calendar-day" [class.has-services]="day.serviceCount > 0">
                        <div class="day-header">
                          <span class="day-name">{{ formatDayName(day.date) }}</span>
                          <span class="day-number">{{ formatDayNumber(day.date) }}</span>
                        </div>
                        @if (day.serviceCount > 0) {
                          <div class="service-indicators">
                            <mat-chip class="service-count-chip">{{ day.serviceCount }}</mat-chip>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .service-dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .dashboard-header mat-card {
      box-shadow: var(--shadow-medium);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      text-align: center;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .summary-card {
      box-shadow: var(--shadow-light);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-medium);
    }

    .summary-card.critical.alert {
      border-left: 4px solid var(--color-error);
      background: linear-gradient(45deg, var(--color-surface), rgba(244, 67, 54, 0.05));
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .summary-icon {
      font-size: 2.5rem;
      height: 2.5rem;
      width: 2.5rem;
    }

    .summary-icon.services { color: #2196f3; }
    .summary-icon.upcoming { color: #ff9800; }
    .summary-icon.critical { color: var(--color-error); }
    .summary-icon.duration { color: #4caf50; }

    .summary-details h3 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .summary-details p {
      margin: 0;
      color: var(--color-textSecondary);
      font-size: 0.9rem;
    }

    .schedule-table-card {
      box-shadow: var(--shadow-medium);
    }

    .table-container {
      overflow-x: auto;
    }

    .service-table {
      width: 100%;
      margin-top: 1rem;
    }

    .vehicle-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .vehicle-info small {
      color: var(--color-textSecondary);
      font-size: 0.8rem;
    }

    .service-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-info small {
      font-size: 0.8rem;
    }

    .date-info .today { color: var(--color-primary); font-weight: 600; }
    .date-info .tomorrow { color: var(--color-warning); }
    .date-info .this-week { color: var(--color-success); }
    .date-info .overdue { color: var(--color-error); font-weight: 600; }

    .location-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .priority-chip {
      font-size: 0.8rem;
      min-height: 24px;
    }

    .priority-chip.priority-low { background: #e8f5e8; color: #2e7d2e; }
    .priority-chip.priority-medium { background: #fff3e0; color: #f57c00; }
    .priority-chip.priority-high { background: #ffebee; color: #c62828; }
    .priority-chip.priority-critical { background: #ffebee; color: #d32f2f; font-weight: 600; }

    .status-chip {
      font-size: 0.8rem;
      min-height: 24px;
    }

    .status-chip.status-scheduled { background: #e3f2fd; color: #1565c0; }
    .status-chip.status-inprogress { background: #fff3e0; color: #f57c00; }
    .status-chip.status-completed { background: #e8f5e8; color: #2e7d2e; }
    .status-chip.status-cancelled { background: #ffebee; color: #c62828; }

    .action-buttons {
      display: flex;
      justify-content: center;
    }

    .service-table tr.overdue {
      background-color: rgba(244, 67, 54, 0.05);
      border-left: 3px solid var(--color-error);
    }

    .service-table tr.critical-row {
      background-color: rgba(255, 152, 0, 0.05);
      font-weight: 500;
    }

    .no-services {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem;
      color: var(--color-textSecondary);
    }

    .no-services mat-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    .calendar-card {
      box-shadow: var(--shadow-medium);
    }

    .calendar-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .calendar-week h4 {
      margin: 0 0 1rem 0;
      color: var(--color-text);
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 0.5rem;
    }

    .week-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;
    }

    .calendar-day {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.75rem;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .calendar-day.has-services {
      border-color: var(--color-primary);
      background: rgba(25, 118, 210, 0.05);
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .day-name {
      font-size: 0.8rem;
      color: var(--color-textSecondary);
      font-weight: 500;
    }

    .day-number {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .service-count-chip {
      font-size: 0.7rem;
      min-height: 20px;
      background: var(--color-primary);
      color: white;
    }

    @media (max-width: 768px) {
      .service-dashboard-container {
        padding: 1rem;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .week-days {
        grid-template-columns: repeat(4, 1fr);
      }

      .calendar-day {
        min-height: 60px;
        padding: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .week-days {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ScheduledServiceComponent implements OnInit {
  private apiService = inject(ApiService);

  upcomingServices = signal<ScheduledService[]>([]);
  serviceSummary = signal<ServiceSummary | null>(null);
  isLoading = signal(false);

  displayedColumns: string[] = ['priority', 'vehicle', 'serviceType', 'scheduledDate', 'duration', 'location', 'status', 'actions'];

  // Computed calendar weeks
  calendarWeeks = computed(() => {
    const services = this.upcomingServices();
    const weeks: Array<{ weekStart: Date; days: Array<{ date: Date; serviceCount: number }> }> = [];
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== 1) { // Start from Monday
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const days = [];

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentDate);
        const serviceCount = services.filter(service => 
          this.isSameDay(service.scheduledDate, dayDate)
        ).length;

        days.push({ date: new Date(dayDate), serviceCount });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push({ weekStart, days });
    }

    return weeks;
  });

  constructor() {}

  ngOnInit(): void {
    this.loadScheduledServices();
  }

  async loadScheduledServices(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Mock data for demonstration - replace with actual API call
      const mockServices: ScheduledService[] = [
        {
          id: 1,
          carId: 101,
          carBrand: 'Toyota',
          carModel: 'Camry',
          licensePlate: 'ABC-123',
          serviceType: 'Oil Change',
          scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
          estimatedDuration: 60,
          locationName: 'Downtown Branch',
          status: 'Scheduled',
          description: 'Regular oil change and filter replacement',
          priority: 'Medium'
        },
        {
          id: 2,
          carId: 102,
          carBrand: 'Honda',
          carModel: 'Civic',
          licensePlate: 'XYZ-789',
          serviceType: 'Brake Inspection',
          scheduledDate: new Date(Date.now() + 172800000), // Day after tomorrow
          estimatedDuration: 120,
          locationName: 'Airport Branch',
          status: 'Scheduled',
          description: 'Comprehensive brake system inspection',
          priority: 'High'
        },
        {
          id: 3,
          carId: 103,
          carBrand: 'BMW',
          carModel: 'X5',
          licensePlate: 'BMW-001',
          serviceType: 'Engine Diagnostic',
          scheduledDate: new Date(Date.now() - 86400000), // Yesterday (overdue)
          estimatedDuration: 180,
          locationName: 'Central Branch',
          status: 'Scheduled',
          description: 'Engine diagnostic and performance check',
          priority: 'Critical'
        }
      ];

      this.upcomingServices.set(mockServices);

      // Calculate summary
      const summary: ServiceSummary = {
        totalServices: mockServices.length,
        upcomingServices: mockServices.filter(s => s.scheduledDate > new Date()).length,
        criticalServices: mockServices.filter(s => s.priority === 'Critical').length,
        averageDuration: mockServices.reduce((sum, s) => sum + s.estimatedDuration, 0) / mockServices.length,
        mostServicedCarType: 'Sedan'
      };

      this.serviceSummary.set(summary);

    } catch (error) {
      console.error('Error loading scheduled services:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  refreshData(): void {
    this.loadScheduledServices();
  }

  exportSchedule(): void {
    // Implementation for exporting schedule
    console.log('Exporting service schedule...');
  }

  viewServiceDetails(service: ScheduledService): void {
    console.log('Viewing service details for:', service);
  }

  rescheduleService(service: ScheduledService): void {
    console.log('Rescheduling service:', service);
  }

  markCompleted(service: ScheduledService): void {
    console.log('Marking service as completed:', service);
  }

  scheduleNewService(): void {
    console.log('Opening new service scheduling dialog...');
  }

  getServiceIcon(serviceType: string): string {
    const icons: { [key: string]: string } = {
      'Oil Change': 'oil_barrel',
      'Brake Inspection': 'track_changes',
      'Engine Diagnostic': 'engineering',
      'Tire Rotation': 'tire_repair',
      'General Maintenance': 'build'
    };
    return icons[serviceType] || 'build';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  }

  getRelativeDate(date: Date): string {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return 'This Week';
    return 'Next Week';
  }

  getDateClass(date: Date): string {
    const relative = this.getRelativeDate(date);
    return relative.toLowerCase().replace(' ', '-');
  }

  isOverdue(date: Date): boolean {
    return date < new Date();
  }

  formatWeek(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDayName(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short'
    }).format(date);
  }

  formatDayNumber(date: Date): string {
    return date.getDate().toString();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}