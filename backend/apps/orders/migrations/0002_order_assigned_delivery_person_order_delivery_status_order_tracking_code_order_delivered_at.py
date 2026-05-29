from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='assigned_delivery_person',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_orders', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('assigned', 'Assigned'), ('picked_up', 'Picked Up'), ('in_transit', 'In Transit'), ('delivered', 'Delivered')], default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='order',
            name='tracking_code',
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name='order',
            name='delivered_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
