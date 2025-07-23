import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../infrastructure/services/api.service';

interface CarStatistics {
  carType: string;
  totalRentals: number;
  utilizationPercentage: number;
  revenue: number;
}

interface TopCarRanking {
  carId: number;
  brand: string;
  model: string;
  type: string;
  rentalCount: number;
  utilizationRate: number;
}

interface DailyMetrics {
  date: string;
  totalRentals: number;
  cancelledRentals: number;
  completedRentals: number;
  activeRentals: number;
  unusedCars: number;
}

interface StatisticsData {
  carStatistics: CarStatistics[];
  topCarRankings: TopCarRanking[];
  dailyMetrics: DailyMetrics[];
  summary: {
    totalCars: number;
    activeRentals: number;
    totalRevenue: number;
    averageUtilization: number;
  };
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressBarModule
  ],
  template: `
    <div class="statistics-container">
      <mat-card class="filter-card">
        <mat-card-header>
          <mat-card-title>Vehicle Statistics</mat-card-title>
          <mat-card-subtitle>Analyze rental performance and utilization rates</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="filterForm" (ngSubmit)="loadStatistics()">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Location</mat-label>
                <mat-select formControlName="locationId">
                  <mat-option value="">All Locations</mat-option>
                  @for (location of locations(); track location.id) {
                    <mat-option [value]="location.id">{{ location.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="filterForm.invalid || isLoading()">
                <mat-icon>analytics</mat-icon>
                Generate Report
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (statisticsData()) {
        <div class="statistics-grid">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <mat-card class="summary-card">
              <mat-card-content>
                <div class="summary-item">
                  <mat-icon class="summary-icon">directions_car</mat-icon>
                  <div class="summary-details">
                    <h3>{{ statisticsData()?.summary.totalCars || 0 }}</h3>
                    <p>Total Vehicles</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="summary-card">
              <mat-card-content>
                <div class="summary-item">
                  <mat-icon class="summary-icon">car_rental</mat-icon>
                  <div class="summary-details">
                    <h3>{{ statisticsData()?.summary.activeRentals || 0 }}</h3>
                    <p>Active Rentals</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="summary-card">
              <mat-card-content>
                <div class="summary-item">
                  <mat-icon class="summary-icon">trending_up</mat-icon>
                  <div class="summary-details">
                    <h3>{{ formatPercentage(statisticsData()?.summary.averageUtilization) }}</h3>
                    <p>Avg. Utilization</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="summary-card">
              <mat-card-content>
                <div class="summary-item">
                  <mat-icon class="summary-icon">attach_money</mat-icon>
                  <div class="summary-details">
                    <h3>{{ formatCurrency(statisticsData()?.summary.totalRevenue) }}</h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Car Type Statistics -->
          <mat-card class="statistics-chart-card">
            <mat-card-header>
              <mat-card-title>Vehicle Type Performance</mat-card-title>
              <mat-card-subtitle>Rental frequency and utilization by vehicle type</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                @for (stat of statisticsData()?.carStatistics || []; track stat.carType) {
                  <div class="stat-item">
                    <div class="stat-header">
                      <span class="stat-label">{{ stat.carType }}</span>
                      <span class="stat-value">{{ stat.totalRentals }} rentals</span>
                    </div>
                    <div class="progress-container">
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="stat.utilizationPercentage"
                        [color]="getProgressBarColor(stat.utilizationPercentage)">
                      </mat-progress-bar>
                      <span class="progress-label">{{ formatPercentage(stat.utilizationPercentage) }}</span>
                    </div>
                    <div class="stat-revenue">
                      Revenue: {{ formatCurrency(stat.revenue) }}
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Top Cars Ranking -->
          <mat-card class="ranking-card">
            <mat-card-header>
              <mat-card-title>Top Performing Vehicles</mat-card-title>
              <mat-card-subtitle>Most rented vehicles in selected period</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="ranking-list">
                @for (car of statisticsData()?.topCarRankings || []; track car.carId; let i = $index) {
                  <div class="ranking-item" [class.top-ranked]="i < 3">
                    <div class="rank-badge">
                      @if (i === 0) {
                        <mat-icon class="gold">emoji_events</mat-icon>
                      } @else if (i === 1) {
                        <mat-icon class="silver">emoji_events</mat-icon>
                      } @else if (i === 2) {
                        <mat-icon class="bronze">emoji_events</mat-icon>
                      } @else {
                        <span class="rank-number">{{ i + 1 }}</span>
                      }
                    </div>
                    <div class="car-info">
                      <h4>{{ car.brand }} {{ car.model }}</h4>
                      <p>{{ car.type }} • {{ car.rentalCount }} rentals</p>
                      <div class="utilization-bar">
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="car.utilizationRate"
                          color="accent">
                        </mat-progress-bar>
                        <span>{{ formatPercentage(car.utilizationRate) }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Daily Metrics Chart -->
          <mat-card class="metrics-card">
            <mat-card-header>
              <mat-card-title>Daily Activity Metrics</mat-card-title>
              <mat-card-subtitle>7-day rental activity overview</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metrics-container">
                @for (metric of statisticsData()?.dailyMetrics || []; track metric.date) {
                  <div class="metric-day">
                    <div class="day-header">
                      <strong>{{ formatDateShort(metric.date) }}</strong>
                    </div>
                    <div class="metric-bars">
                      <div class="metric-bar">
                        <span class="metric-label">Completed</span>
                        <div class="bar completed" [style.height.px]="getBarHeight(metric.completedRentals)"></div>
                        <span class="metric-count">{{ metric.completedRentals }}</span>
                      </div>
                      <div class="metric-bar">
                        <span class="metric-label">Active</span>
                        <div class="bar active" [style.height.px]="getBarHeight(metric.activeRentals)"></div>
                        <span class="metric-count">{{ metric.activeRentals }}</span>
                      </div>
                      <div class="metric-bar">
                        <span class="metric-label">Cancelled</span>
                        <div class="bar cancelled" [style.height.px]="getBarHeight(metric.cancelledRentals)"></div>
                        <span class="metric-count">{{ metric.cancelledRentals }}</span>
                      </div>
                      <div class="metric-bar">
                        <span class="metric-label">Unused</span>
                        <div class="bar unused" [style.height.px]="getBarHeight(metric.unusedCars)"></div>
                        <span class="metric-count">{{ metric.unusedCars }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      @if (isLoading()) {
        <div class="loading-container">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Loading statistics...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .statistics-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .filter-card {
      box-shadow: var(--shadow-medium);
    }

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-row mat-form-field {
      min-width: 200px;
    }

    .statistics-grid {
      display: grid;
      gap: 2rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      box-shadow: var(--shadow-light);
      transition: transform 0.2s ease;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-medium);
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
      color: var(--color-primary);
    }

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

    .statistics-chart-card {
      grid-column: 1 / -1;
      box-shadow: var(--shadow-medium);
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-label {
      font-weight: 600;
      color: var(--color-text);
    }

    .stat-value {
      color: var(--color-textSecondary);
      font-size: 0.9rem;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-container mat-progress-bar {
      flex: 1;
      height: 8px;
    }

    .progress-label {
      min-width: 50px;
      text-align: right;
      font-weight: 600;
      color: var(--color-primary);
    }

    .stat-revenue {
      color: var(--color-success);
      font-weight: 500;
      font-size: 0.9rem;
    }

    .ranking-card {
      box-shadow: var(--shadow-medium);
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      transition: all 0.2s ease;
    }

    .ranking-item:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow-light);
    }

    .ranking-item.top-ranked {
      background: linear-gradient(45deg, var(--color-surface), rgba(var(--color-primary), 0.05));
      border-color: var(--color-primary);
    }

    .rank-badge {
      min-width: 40px;
      text-align: center;
    }

    .rank-badge mat-icon {
      font-size: 1.5rem;
    }

    .rank-badge .gold { color: #ffd700; }
    .rank-badge .silver { color: #c0c0c0; }
    .rank-badge .bronze { color: #cd7f32; }

    .rank-number {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--color-textSecondary);
    }

    .car-info {
      flex: 1;
    }

    .car-info h4 {
      margin: 0 0 0.25rem 0;
      color: var(--color-text);
    }

    .car-info p {
      margin: 0 0 0.5rem 0;
      color: var(--color-textSecondary);
      font-size: 0.9rem;
    }

    .utilization-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .utilization-bar mat-progress-bar {
      flex: 1;
      height: 6px;
    }

    .utilization-bar span {
      min-width: 45px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .metrics-card {
      grid-column: 1 / -1;
      box-shadow: var(--shadow-medium);
    }

    .metrics-container {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 1rem 0;
    }

    .metric-day {
      min-width: 120px;
      text-align: center;
    }

    .day-header {
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .metric-bars {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      height: 100px;
      gap: 0.25rem;
    }

    .metric-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      min-width: 20px;
    }

    .metric-label {
      font-size: 0.7rem;
      color: var(--color-textSecondary);
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }

    .bar {
      width: 16px;
      min-height: 2px;
      border-radius: 2px 2px 0 0;
    }

    .bar.completed { background: var(--color-success); }
    .bar.active { background: var(--color-primary); }
    .bar.cancelled { background: var(--color-error); }
    .bar.unused { background: var(--color-textSecondary); }

    .metric-count {
      font-size: 0.7rem;
      font-weight: 600;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
    }

    @media (max-width: 768px) {
      .statistics-container {
        padding: 1rem;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .metrics-container {
        gap: 0.5rem;
      }

      .metric-day {
        min-width: 80px;
      }
    }
  `]
})
export class StatisticsComponent implements OnInit {
  private apiService = inject(ApiService);
  private formBuilder = inject(FormBuilder);

  filterForm: FormGroup;
  statisticsData = signal<StatisticsData | null>(null);
  locations = signal<any[]>([]);
  isLoading = signal(false);

  // Computed values for enhanced reactivity
  maxDailyValue = computed(() => {
    const data = this.statisticsData();
    if (!data?.dailyMetrics) return 10;
    
    return Math.max(
      ...data.dailyMetrics.flatMap(m => [
        m.completedRentals,
        m.activeRentals,
        m.cancelledRentals,
        m.unusedCars
      ])
    );
  });

  constructor() {
    this.filterForm = this.formBuilder.group({
      startDate: [this.getDefaultStartDate(), Validators.required],
      endDate: [new Date(), Validators.required],
      locationId: ['']
    });
  }

  ngOnInit(): void {
    this.loadLocations();
    this.loadStatistics();
  }

  private async loadLocations(): Promise<void> {
    try {
      const locations = await this.apiService.getLocations().toPromise();
      this.locations.set(locations || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }

  async loadStatistics(): Promise<void> {
    if (this.filterForm.invalid) return;

    const { startDate, endDate, locationId } = this.filterForm.value;
    this.isLoading.set(true);

    try {
      const statistics = await this.apiService.getStatistics(
        startDate.toISOString(),
        endDate.toISOString(),
        locationId || undefined
      ).toPromise();

      this.statisticsData.set(statistics);

    } catch (error) {
      console.error('Error loading statistics:', error);
      this.statisticsData.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  getProgressBarColor(percentage: number): 'primary' | 'accent' | 'warn' {
    if (percentage >= 80) return 'primary';
    if (percentage >= 50) return 'accent';
    return 'warn';
  }

  getBarHeight(value: number): number {
    const maxHeight = 60;
    const percentage = value / this.maxDailyValue();
    return Math.max(2, percentage * maxHeight);
  }

  formatPercentage(value: number | undefined): string {
    return value ? `${value.toFixed(1)}%` : '0.0%';
  }

  formatCurrency(value: number | undefined): string {
    return value ? `$${value.toLocaleString()}` : '$0';
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30); // 30 days ago
    return date;
  }
}