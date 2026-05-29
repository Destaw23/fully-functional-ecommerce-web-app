from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("recommendations", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="interaction",
            name="product",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="interactions",
                to="products.product",
            ),
        ),
    ]
